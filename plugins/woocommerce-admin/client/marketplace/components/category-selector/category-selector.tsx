/**
 * External dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Spinner } from '@wordpress/components';
import { useQuery } from '@woocommerce/navigation';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import CategoryLink from './category-link';
import './category-selector.scss';
import CategoryDropdown from './category-dropdown';
import { MARKETPLACE_URL } from '../constants';
import { mobile } from '@wordpress/icons';

export type Category = {
	readonly slug: string;
	readonly label: string;
	selected: boolean;
};

export type CategoryAPIItem = {
	readonly slug: string;
	readonly label: string;
};

function fetchCategories(): Promise< CategoryAPIItem[] > {
	return fetch( MARKETPLACE_URL + '/wp-json/wccom-extensions/1.0/categories' )
		.then( ( response ) => {
			if ( ! response.ok ) {
				throw new Error( response.statusText );
			}

			return response.json();
		} )
		.then( ( json ) => {
			return json;
		} )
		.catch( () => {
			return [];
		} );
}

export default function CategorySelector(): JSX.Element {
	const [ firstBatch, setFirstBatch ] = useState< Category[] >( [] );
	const [ secondBatch, setSecondBatch ] = useState< Category[] >( [] );
	const [ selected, setSelected ] = useState< Category >();
	const [ isLoading, setIsLoading ] = useState( false );

	function isSelectedInSecondBatch() {
		if ( ! selected ) {
			return false;
		}

		return secondBatch.find(
			( category ) => category.slug === selected.slug
		);
	}

	const query = useQuery();

	useEffect( () => {
		// If no category is selected, show All as selected
		let categoryToSearch = '_all';

		if ( query.category ) {
			categoryToSearch = query.category;
		}

		const allCategories = firstBatch.concat( secondBatch );

		// Check if category is in the first batch
		const selectedCategory = allCategories.find(
			( category ) => category.slug === categoryToSearch
		);

		if ( selectedCategory ) {
			setSelected( selectedCategory );
		}
	}, [ query, firstBatch, secondBatch ] );

	useEffect( () => {
		setIsLoading( true );

		fetchCategories()
			.then( ( categoriesFromAPI: CategoryAPIItem[] ) => {
				const categories: Category[] = categoriesFromAPI.map(
					( categoryAPIItem: CategoryAPIItem ): Category => {
						return {
							...categoryAPIItem,
							selected: false,
						};
					}
				);

				// Put the "All" category to the beginning
				categories.sort( ( a ) => {
					if ( a.slug === '_all' ) {
						return -1;
					}

					return 1;
				} );

				// Split array into two from 7th item
				const firstBatchCategories = categories.slice( 0, 7 );
				const secondBatchCategories = categories.slice( 7 );

				setFirstBatch( firstBatchCategories );
				setSecondBatch( secondBatchCategories );
			} )
			.finally( () => {
				setIsLoading( false );
			} );
	}, [] );

	function mobileCategoryDropdownLabel() {
		if ( ! selected ) {
			return 'All Categories';
		}

		if ( selected.label === 'All' ) {
			return 'All Categories';
		}

		return selected.label;
	}

	if ( isLoading ) {
		return (
			<>
				{ __( 'Loading categories…', 'woocommerce' ) }
				<Spinner />
			</>
		);
	}

	return (
		<>
			<ul className="woocommerce-marketplace__category-selector">
				{ firstBatch.map( ( category ) => (
					<li
						className="woocommerce-marketplace__category-item"
						key={ category.slug }
					>
						<CategoryLink
							{ ...category }
							selected={ category.slug === selected?.slug }
						/>
					</li>
				) ) }
				<li className="woocommerce-marketplace__category-item">
					<CategoryDropdown
						label={ __( 'More', 'woocommerce' ) }
						categories={ secondBatch }
						buttonClassName={ classNames(
							'woocommerce-marketplace__category-item-button',
							{
								'woocommerce-marketplace__category-item-button--selected':
									isSelectedInSecondBatch(),
							}
						) }
						contentClassName="woocommerce-marketplace__category-item-content"
						arrowIconSize={ 20 }
						selected={ selected }
					/>
				</li>
			</ul>

			<div className="woocommerce-marketplace__category-selector--full-width">
				<CategoryDropdown
					label={ mobileCategoryDropdownLabel() }
					categories={ firstBatch.concat( secondBatch ) }
					buttonClassName="woocommerce-marketplace__category-dropdown-button"
					className="woocommerce-marketplace__category-dropdown"
					contentClassName="woocommerce-marketplace__category-dropdown-content"
					selected={ selected }
				/>
			</div>
		</>
	);
}
