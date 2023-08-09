/**
 * External dependencies
 */
import { useContext } from '@wordpress/element';
import { Spinner } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { ProductListContext } from '../../contexts/product-list-context';
import './product-list-content.scss';

export default function ProductListContent(): JSX.Element {
	const productListContextValue = useContext( ProductListContext );
	const products = productListContextValue.productList.slice( 0, 21 );
	const isLoading = productListContextValue.isLoading;

	if ( isLoading ) {
		return <Spinner />;
	}

	if ( products.length === 0 ) {
		return <p>No products.</p>;
	}

	return (
		<div className="woocommerce-marketplace__product-list-content">
			{ products.map( ( product ) => {
				return (
					<div
						className="woocommerce-marketplace__extension-card"
						key={ product.id }
					>
						<p>{ product.title }</p>
					</div>
				);
			} ) }
		</div>
	);
}
