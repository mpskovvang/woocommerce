/**
 * External dependencies
 */
import { useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ProductList from '../product-list/product-list';
import './extensions.scss';
import { ProductListContext } from '../../contexts/product-list-context';

export default function Extensions(): JSX.Element {
	const productListContextValue = useContext( ProductListContext );
	const productList = productListContextValue.productList;

	let title = __( 'Extensions', 'woocommerce' );

	if ( productList.length > 0 ) {
		title =
			`${ productList.length }` + ' ' + __( 'extensions', 'woocommerce' );
	}

	return (
		<div className="woocommerce-marketplace__extensions">
			<ProductList title={ title } />
		</div>
	);
}
