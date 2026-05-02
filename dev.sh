#!/bin/bash
osascript -e 'tell app "Terminal" to do script "cd /Users/jonahalt/coding/Phaysr/backend && pnpm run dev"'
osascript -e 'tell app "Terminal" to do script "cd /Users/jonahalt/coding/Phaysr/app && pnpm run dev"'
osascript -e 'tell app "Terminal" to do script "cd /Users/jonahalt/coding/Phaysr/demo-site && pnpm run dev"'
osascript -e 'tell app "Terminal" to do script "cd /Users/jonahalt/coding/Phaysr/widget && pnpm run dev"'
