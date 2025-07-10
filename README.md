## V2ray config finder for telegram
Crawl telegram channels and detect v2ray URIs

### This app is meant to be used alongside [v2ray-config-tester](https://github.com/Keivan-sf/v2ray-config-tester)

### How to run
Clone the repository and install the dependencies
```bash
pnpm i
```
Get your telegram api id and api hash using [my.telegram.org/apps](my.telegram.org/apps)

Create a `.env` file (or use environment variables as you please):
```env
# [REQUIRED] telegram app id
APP_API_ID=

# [REQUIRED] telegram api hash
APP_API_HASH=

# [OPTIONAL, DEFAULT=http://127.0.0.1:5574/add-config] endpoint to send the configs to (meant to be from v2ray-config-tester)
CONFIG_TESTER_URL="http://127.0.0.1:5574/add-config"
```

Run the program from a network that can access telegram. We recommend you use a local socks proxy with [proxychains](https://github.com/haad/proxychains). Simply define your proxy in the proxychains config provided and run the application like below:
```
proxychains4 -f ./proxychains.conf pnpm start
```  
