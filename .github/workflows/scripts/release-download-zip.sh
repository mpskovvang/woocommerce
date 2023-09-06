#
# Download WooCommerce ZIP from GitHub repo.
# If ZIP wasn't found in GitHub, download from WordPress.org.
# Exit with an error if both download attempts were unsuccessful.
#

#!/usr/bin/env

ZIP_PATH="tmp/woocommerce.zip"

download_zip_from_github() {
    echo "Downloading from GitHub repo..."
    gh release download $RELEASE_TAG --dir tmp
}

download_zip_from_dotorg() {
    echo "Downloading from WordPress.org..."
    DOWNLOAD_URL="https://downloads.wordpress.org/plugin/woocommerce.$RELEASE_TAG.zip"
    curl -L -f -o $ZIP_PATH $DOWNLOAD_URL
}

mkdir -p tmp

download_zip_from_github

if [ ! -f $ZIP_PATH ]; then
    download_zip_from_dotorg
fi

test -f $ZIP_PATH
exit $?
