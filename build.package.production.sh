#!/bin/sh
# 正式包

d=$( date +%Y.%m.%d.%H.%M.%S )
will_str=$(grep "VITE_BUILD_DATE" .env.production|awk -F'=' '{print$2}')

if [ "$(uname)" == "Darwin" ]; then
    sed -i "" -r "s#${will_str}#${d}#g" .env.production
else
    sed -i -r "s#${will_str}#${d}#g" .env.production
fi

rm -rf node_modules/.cache
echo "BUILD_SEV=$BUILD_SEV"
yarn build

if [ "$BUILD_SEV" == "" ]; then
    tar -zcvf build.tar.gz ./build
    rm -rf ./build

    if [ "$(uname)" == "Darwin" ]; then
        open .
    fi
fi
