import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as electricity from '../src/lib/electricity-cost.mjs';
import * as mining from '../src/lib/mining-economics.mjs';

// Minimal DOM adapter executes the real controller event handlers with real models.
function harness(script, model, defaults) {
  const nodes = new Map(); const handlers = new Map(); let active;
  const node = (id) => {
    if (!nodes.has(id)) nodes.set(id, { id, name: id, value: '', textContent: '', hidden: false, attrs: {}, dataset: {}, setAttribute(k,v){this.attrs[k]=v;}, focus(){active=this;}, scrollIntoView(options){this.scrolled=options;}, addEventListener(type,fn){handlers.set(`${id}:${type}`,fn);} });
    return nodes.get(id);
  };
  const form = node(script === 'electricity-calculator' ? 'electricity-calculator' : 'mining-calculator');
  const fields = Object.fromEntries(Object.entries(defaults).map(([key,value]) => {const item=node(key);item.value=value;return [key,item];}));
  form.elements = { ...fields, namedItem: (name) => fields[name] };
  form.querySelectorAll = (selector) => selector === '.field-error' ? [...nodes.values()].filter(n=>n.id.endsWith('-error')) : Object.values(fields);
  form.querySelector = () => Object.values(fields).find(n=>n.attrs['aria-invalid']==='true');
  const aliases = script === 'electricity-calculator' ? { 'rate-unit': fields.rateUnit, 'runtime-preset': fields.runtime } : {};
  const document = { querySelector: (selector) => selector[0]==='#' ? aliases[selector.slice(1)] ?? node(selector.slice(1)) : null, querySelectorAll: () => [] };
  const source = readFileSync(new URL(`../src/scripts/${script}.js`,import.meta.url),'utf8').replace(/^import .*?;\r?\n/,'');
  vm.runInNewContext(source, {...model,document,Intl,setTimeout:(fn)=>{fn();return 1;},clearTimeout:()=>{},requestAnimationFrame:fn=>fn()});
  return { node,fields,active:()=>active, set(name,value,type='input'){fields[name].value=value;handlers.get(`${form.id}:${type}`)?.({target:fields[name]});}, event(type,name){handlers.get(`${form.id}:${type}`)?.({target:fields[name]??form,preventDefault(){}});}, reset(){for(const [key,value] of Object.entries(defaults))fields[key].value=value;handlers.get(`${form.id}:reset`)();} };
}
const blank = { minerHashrate:'',wallPowerWatts:'',hoursPerDay:'',electricityPricePerKwh:'',poolFeePercent:'',expectedRewardPerBlock:'',xmrPrice:'',networkDifficulty:'',networkHashrate:'',networkBasis:'difficulty',currency:'GBP' };
const scenario={minerHashrate:'1000',wallPowerWatts:'100',hoursPerDay:'24',electricityPricePerKwh:'0.20',poolFeePercent:'1',expectedRewardPerBlock:'0.6',xmrPrice:'150',networkDifficulty:'86400000000'};
const miner=()=>harness('mining-profitability',mining,blank);
const energy=()=>harness('electricity-calculator',electricity,{watts:'100',rate:'',hours:'24',days:'30',currency:'GBP',rateUnit:'kwh',runtime:'24'});

test('profitability partial input leaves untouched fields quiet and results unavailable',()=>{
  const app=miner();app.set('minerHashrate','1000');
  for(const field of Object.values(app.fields))assert.notEqual(field.attrs['aria-invalid'],'true');
  assert.equal(app.node('daily-net').textContent,'—');
  assert.equal(app.node('daily-revenue').textContent,'—');
});
test('profitability blur and edits validate only touched fields and clear corrected errors',()=>{
  const app=miner();app.event('focusout','wallPowerWatts');
  assert.equal(app.node('power-error').textContent,'Enter a value.');
  assert.equal(app.node('hours-error').textContent,'');
  app.set('wallPowerWatts','-1');assert.equal(app.fields.wallPowerWatts.attrs['aria-invalid'],'true');
  app.set('wallPowerWatts','100');assert.equal(app.node('power-error').textContent,'');
  assert.equal(app.fields.wallPowerWatts.attrs['aria-invalid'],'false');
});
test('explicit calculation exposes missing assumptions and focuses the first invalid field',()=>{
  const app=miner();app.event('submit');
  assert.equal(app.active(),app.fields.minerHashrate);
  assert.equal(app.fields.networkDifficulty.attrs['aria-invalid'],'true');
  assert.equal(app.node('daily-net').textContent,'—');
});
test('profitability daily results reuse the model; removing an assumption clears every headline',()=>{
  const app=miner();for(const [key,value] of Object.entries(scenario))app.set(key,value);
  const result=mining.calculateMiningProjections({ ...Object.fromEntries(Object.entries(scenario).map(([k,v])=>[k,Number(v)])),networkBasis:'difficulty',currency:'GBP' })[0];
  assert.equal(app.node('daily-net').textContent,mining.formatMoney(result.estimatedNet,'GBP'));
  assert.equal(app.node('daily-revenue').textContent,mining.formatMoney(result.revenueAfterPoolFees,'GBP'));
  assert.equal(app.node('daily-cost').textContent,mining.formatMoney(result.electricityCost,'GBP'));
  assert.ok(result.estimatedNet<0);app.event('submit');assert.equal(app.active().id,'mining-results-title');
  assert.equal(app.active().scrolled.block,'start');
  app.set('xmrPrice','');for(const id of ['daily-net','daily-revenue','daily-cost'])assert.equal(app.node(id).textContent,'—');
});
test('profitability basis switch, currency labels and reset preserve existing behavior',()=>{
  const app=miner();for(const [key,value] of Object.entries(scenario))app.set(key,value);
  app.set('networkBasis','hashrate','change');assert.equal(app.fields.networkDifficulty.value,'');assert.equal(app.node('daily-net').textContent,'—');
  app.set('networkHashrate','720000000');app.set('currency','USD','change');assert.match(app.node('daily-net').textContent,/\$/);assert.equal(app.fields.xmrPrice.value,'150');
  app.reset();assert.equal(app.node('daily-net').textContent,'—');assert.equal(app.fields.minerHashrate.attrs['aria-invalid'],'false');
});
test('electricity reproduces pence mismatch → new watts/runtime/period → compatible currency recovery',()=>{
  const app=energy();app.set('rateUnit','pence','change');app.set('rate','20');
  assert.equal(app.node('energy-day').textContent,'2.4 kWh');
  app.set('currency','USD','change');app.set('watts','200');
  assert.equal(app.node('power-readout').textContent,'200 W');assert.equal(app.node('energy-day').textContent,'4.8 kWh');assert.equal(app.node('cost-day').textContent,'—');
  app.set('hours','12');app.set('days','7');assert.equal(app.node('energy-day').textContent,'2.4 kWh');assert.equal(app.node('energy-period').textContent,'16.8 kWh');assert.equal(app.node('period-label').textContent,'7 DAYS');
  app.set('currency','GBP','change');assert.equal(app.node('cost-day').textContent,electricity.formatCost(0.48,'GBP'));assert.equal(app.node('rate-error').textContent,'');
});
test('invalid tariff preserves fresh energy; invalid power clears stale results; unit recovery does not convert numbers',()=>{
  const app=energy();app.set('rate','bad');app.set('watts','200');assert.equal(app.node('energy-day').textContent,'4.8 kWh');assert.equal(app.node('cost-day').textContent,'—');
  app.set('watts','bad');assert.equal(app.node('energy-day').textContent,'—');assert.equal(app.node('power-readout').textContent,'—');
  app.reset();app.set('rateUnit','pence','change');app.set('rate','20');app.set('currency','USD','change');app.set('rateUnit','kwh','change');
  assert.equal(app.fields.rate.value,'20');assert.equal(app.node('cost-day').textContent,electricity.formatCost(48,'USD'));
});
test('calculator input events do not announce a full result on every keystroke',()=>{
  const app=energy();const before=app.node('calc-announcement').textContent;app.set('watts','200');assert.equal(app.node('calc-announcement').textContent,before);app.event('focusout','watts');assert.match(app.node('calc-announcement').textContent,/Energy/);
  const scenario=miner();scenario.set('minerHashrate','1000');assert.equal(scenario.node('mining-announcement').textContent,'');assert.match(scenario.node('mining-status').textContent,/remaining/);scenario.event('focusout','minerHashrate');assert.match(scenario.node('mining-announcement').textContent,/remaining/);
});
