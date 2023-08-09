/**
 * External dependencies
 */
import { Dropdown } from '@wordpress/components';
import { chevronDown, chevronUp, Icon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { navigateTo, getNewPath } from '@woocommerce/navigation';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import { Category } from './category-selector';

function DropdownContent( props: {
	readonly categories: Category[];
	readonly selected?: Category;
} ): JSX.Element {
	function updateCategorySelection(
		event: React.MouseEvent< HTMLButtonElement >
	) {
		const slug = event.currentTarget.value;

		navigateTo( {
			url: getNewPath( { category: slug } ),
		} );
	}

	return (
		<ul className="woocommerce-marketplace__category-dropdown-list">
			{ props.categories.map( ( category ) => (
				<li
					className="woocommerce-marketplace__category-dropdown-item"
					key={ category.slug }
				>
					<button
						className={ classNames(
							'woocommerce-marketplace__category-dropdown-item-button',
							{
								'woocommerce-marketplace__category-dropdown-item-button--selected':
									category.slug === props.selected?.slug,
							}
						) }
						value={ category.slug }
						onClick={ updateCategorySelection }
					>
						{ category.label }
					</button>
				</li>
			) ) }
		</ul>
	);
}

type CategoryDropdownProps = {
	label: string;
	categories: Category[];
	className?: string;
	buttonClassName?: string;
	contentClassName?: string;
	arrowIconSize?: number;
	selected?: Category;
};

export default function CategoryDropdown(
	props: CategoryDropdownProps
): JSX.Element {
	return (
		<Dropdown
			renderToggle={ ( { isOpen, onToggle } ) => (
				<button
					onClick={ onToggle }
					className={ props.buttonClassName }
					aria-label={ __(
						'Toggle category dropdown',
						'woocommerce'
					) }
				>
					{ props.label }
					<Icon
						icon={ isOpen ? chevronUp : chevronDown }
						size={ props.arrowIconSize }
					/>
				</button>
			) }
			className={ props.className }
			renderContent={ () => (
				<DropdownContent
					categories={ props.categories }
					selected={ props.selected }
				/>
			) }
			contentClassName={ props.contentClassName }
		/>
	);
}
