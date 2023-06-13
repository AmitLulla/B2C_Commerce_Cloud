function getQualifyingAssets(assets) {
    if(empty(assets)){
        return [];
    }

    return assets.toArray();
};

module.exports = {
    getQualifyingAssets: getQualifyingAssets
}