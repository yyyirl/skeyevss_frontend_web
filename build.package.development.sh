#!/bin/zsh
# 测试包
d=$( date +%Y.%m.%d.%H.%M.%S )
tmp=.env.production.back

will_str=$(grep "VITE_BUILD_DATE" .env.dev|awk -F'=' '{print$2}')
sed -i "" -r "s#${will_str}#${d}#g" .env.dev

\cp .env.production $tmp
\cp .env.dev .env.production

rm -rf node_modules/.cache
yarn build

tar -zcvf test.build.tar.gz build

mv $tmp .env.production
rm -rf ./build

open .
