module.exports = async ( { github, core } ) => {
	const { RELEASE_TAG } = process.env;

	let foundInGitHub, foundInDotOrg;

	const searchGitHub = async () => {
		const url = `https://api.github.com/repos/woocommerce/woocommerce/releases/tags/${ RELEASE_TAG }`;
		const response = await github.request( url );
		return response.status === 200;
	};

	const searchDotOrg = async () => {
		const url = `https://api.wordpress.org/plugins/info/1.0/woocommerce.json`;
		const response = await github.request( url );
		return response.data.versions[ RELEASE_TAG ];
	};

	foundInGitHub = await searchGitHub();

	if ( foundInGitHub ) {
		core.setOutput( 'is-valid', true );
		return;
	}

	foundInDotOrg = await searchDotOrg();

	if ( foundInDotOrg ) {
		core.setOutput( 'is-valid', true );
		return;
	}

	core.setOutput( 'is-valid', false );
};
