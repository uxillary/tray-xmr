@echo off
set /p user_address=Enter your Monero address: 
set /p pool_choice=Enter pool (supportxmr / moneroocean): 

REM Generate the config.json with the chosen address and pool
echo Creating config.json...
(
echo {
echo     "address": "%user_address%",
echo     "pool": "%pool_choice%",
echo     "pools": {
echo         "supportxmr": {
echo             "url": "https://supportxmr.com/api/miner/{address}/stats"
echo         },
echo         "moneroocean": {
echo             "url": "https://moneroocean.stream/api/user/stats?address={address}"
echo         }
echo     }
echo }
) > config.json

echo Config saved to config.json.
pause
start xmr_tray.exe
