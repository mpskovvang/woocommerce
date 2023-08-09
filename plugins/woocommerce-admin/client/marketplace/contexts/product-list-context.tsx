/**
 * External dependencies
 */
import { useQuery } from '@woocommerce/navigation';
import { useState, useEffect, createContext } from '@wordpress/element';

type ProductListItemType = {
	title: string;
	image: string;
	excerpt: string;
	link: string;
	demo_url: string;
	price: string;
	hash: string;
	slug: string;
	id: number;
	rating: number | null;
	reviews_count: number | null;
	vendor_name: string;
	vendor_url: string;
	icon: string;
};

type ProductListContextType = {
	productList: ProductListItemType[];
	isLoading: boolean;
};

export const ProductListContext = createContext< ProductListContextType >( {
	productList: [],
	isLoading: false,
} );

type ProductListContextProviderProps = {
	children: JSX.Element;
	country?: string;
	locale?: string;
};

/**
 * Internal dependencies
 */
export function ProductListContextProvider(
	props: ProductListContextProviderProps
): JSX.Element {
	const [ isLoading, setIsLoading ] = useState( false );
	const [ productList, setProductList ] = useState< ProductListItemType[] >(
		[]
	);

	const contextValue = {
		productList,
		isLoading,
	};

	const query = useQuery();

	useEffect( () => {
		setIsLoading( true );
		setProductList( [] );

		// Build up a query string
		const params = new URLSearchParams();

		params.append( 'term', query.term ?? '' );
		params.append( 'country', props.country ?? '' );
		params.append( 'locale', props.locale ?? '' );

		if ( query.category ) {
			params.append( 'category', query.category );
		}

		const wccomSearchEndpoint =
			'https://woocommerce.com/wp-json/wccom-extensions/1.0/search' +
			'?' +
			params.toString();

		// Fetch data from WCCOM API
		fetch( wccomSearchEndpoint )
			.then( ( response ) => response.json() )
			.then( ( response ) => {
				setProductList( response.products );
			} )
			.finally( () => {
				setIsLoading( false );
			} );
	}, [ query, props.country, props.locale ] );

	return (
		<ProductListContext.Provider value={ contextValue }>
			{ props.children }
		</ProductListContext.Provider>
	);
}
