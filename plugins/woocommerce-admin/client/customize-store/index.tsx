/**
 * External dependencies
 */
import { Sender, createMachine } from 'xstate';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { useMachine, useSelector } from '@xstate/react';
import { getQuery, updateQueryString } from '@woocommerce/navigation';
import { OPTIONS_STORE_NAME } from '@woocommerce/data';
import { dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useFullScreen } from '~/utils';
import {
	Intro,
	events as introEvents,
	services as introServices,
	actions as introActions,
} from './intro';
import { DesignWithAi, events as designWithAiEvents } from './design-with-ai';
import { AssemblerHub, events as assemblerHubEvents } from './assembler-hub';
import {
	Transitional,
	events as transitionalEvents,
	services as transitionalServices,
} from './transitional';
import { findComponentMeta } from '~/utils/xstate/find-component';
import {
	CustomizeStoreComponentMeta,
	CustomizeStoreComponent,
	customizeStoreStateMachineContext,
} from './types';
import { ThemeCard } from './intro/theme-cards';
import './style.scss';

export type customizeStoreStateMachineEvents =
	| introEvents
	| designWithAiEvents
	| assemblerHubEvents
	| transitionalEvents
	| { type: 'AI_WIZARD_CLOSED_BEFORE_COMPLETION'; payload: { step: string } }
	| { type: 'EXTERNAL_URL_UPDATE' };

const updateQueryStep = (
	_context: unknown,
	_evt: unknown,
	{ action }: { action: unknown }
) => {
	const { path } = getQuery() as { path: string };
	const step = ( action as { step: string } ).step;
	const pathFragments = path.split( '/' ); // [0] '', [1] 'customize-store', [2] step slug [3] design-with-ai, assembler-hub path fragments
	if ( pathFragments[ 1 ] === 'customize-store' ) {
		if ( pathFragments[ 2 ] !== step ) {
			// this state machine is only concerned with [2], so we ignore changes to [3]
			// [1] is handled by router at root of wc-admin
			updateQueryString( {}, `/customize-store/${ step }` );
		}
	}
};

const markTaskComplete = async () => {
	return dispatch( OPTIONS_STORE_NAME ).updateOptions( {
		woocommerce_admin_customize_store_completed: 'yes',
	} );
};

const browserPopstateHandler =
	() => ( sendBack: Sender< { type: 'EXTERNAL_URL_UPDATE' } > ) => {
		const popstateHandler = () => {
			sendBack( { type: 'EXTERNAL_URL_UPDATE' } );
		};
		window.addEventListener( 'popstate', popstateHandler );
		return () => {
			window.removeEventListener( 'popstate', popstateHandler );
		};
	};

export const machineActions = {
	updateQueryStep,
};

export const customizeStoreStateMachineActions = {
	...introActions,
	...machineActions,
};

export const customizeStoreStateMachineServices = {
	...introServices,
	...transitionalServices,
	browserPopstateHandler,
	markTaskComplete,
};
export const customizeStoreStateMachineDefinition = createMachine( {
	id: 'customizeStore',
	initial: 'navigate',
	predictableActionArguments: true,
	preserveActionOrder: true,
	schema: {
		context: {} as customizeStoreStateMachineContext,
		events: {} as customizeStoreStateMachineEvents,
		services: {} as {
			fetchThemeCards: { data: ThemeCard[] };
		},
	},
	context: {
		intro: {
			themeCards: [] as ThemeCard[],
			activeTheme: '',
		},
	} as customizeStoreStateMachineContext,
	invoke: {
		src: 'browserPopstateHandler',
	},
	on: {
		EXTERNAL_URL_UPDATE: {
			target: 'navigate',
		},
		AI_WIZARD_CLOSED_BEFORE_COMPLETION: {
			target: 'intro',
			actions: [ { type: 'updateQueryStep', step: 'intro' } ],
		},
	},
	states: {
		navigate: {
			always: [
				{
					target: 'intro',
					cond: {
						type: 'hasStepInUrl',
						step: 'intro',
					},
				},
				{
					target: 'designWithAi',
					cond: {
						type: 'hasStepInUrl',
						step: 'design-with-ai',
					},
				},
				{
					target: 'assemblerHub',
					cond: {
						type: 'hasStepInUrl',
						step: 'assembler-hub',
					},
				},
				{
					target: 'transitionalScreen',
					cond: {
						type: 'hasStepInUrl',
						step: 'transitional',
					},
				},
				{
					target: 'intro',
				},
			],
		},
		intro: {
			id: 'intro',
			initial: 'preIntro',
			states: {
				preIntro: {
					invoke: {
						src: 'fetchThemeCards',
						onDone: {
							target: 'intro',
							actions: [ 'assignThemeCards' ],
						},
					},
				},
				intro: {
					meta: {
						component: Intro,
					},
				},
			},
			on: {
				DESIGN_WITH_AI: {
					target: 'designWithAi',
				},
				SELECTED_ACTIVE_THEME: {
					target: 'assemblerHub',
				},
				CLICKED_ON_BREADCRUMB: {
					target: 'backToHomescreen',
				},
				SELECTED_NEW_THEME: {
					target: 'appearanceTask',
				},
				SELECTED_BROWSE_ALL_THEMES: {
					target: 'appearanceTask',
				},
			},
		},
		designWithAi: {
			initial: 'preDesignWithAi',
			states: {
				preDesignWithAi: {
					always: {
						target: 'designWithAi',
					},
				},
				designWithAi: {
					meta: {
						component: DesignWithAi,
					},
					entry: [
						{ type: 'updateQueryStep', step: 'design-with-ai' },
					],
				},
			},
			on: {
				THEME_SUGGESTED: {
					target: 'assemblerHub',
				},
			},
		},
		assemblerHub: {
			initial: 'assemblerHub',
			states: {
				assemblerHub: {
					entry: [
						{ type: 'updateQueryStep', step: 'assembler-hub' },
					],
					meta: {
						component: AssemblerHub,
					},
				},
				postAssemblerHub: {
					invoke: {
						src: 'markTaskComplete',
						onDone: {
							target: 'waitForSitePreview',
						},
					},
				},
				waitForSitePreview: {
					after: {
						// Wait for 5 seconds before redirecting to the transitional page. This is to ensure that the site preview image is refreshed.
						5000: {
							target: '#customizeStore.transitionalScreen',
						},
					},
				},
			},
			on: {
				FINISH_CUSTOMIZATION: {
					// Pre-fetch the site preview image for the site for transitional page.
					actions: [ 'prefetchSitePreview' ],
					target: '.postAssemblerHub',
				},
				GO_BACK_TO_DESIGN_WITH_AI: {
					target: 'designWithAi',
				},
			},
		},
		transitionalScreen: {
			entry: [ { type: 'updateQueryStep', step: 'transitional' } ],
			meta: {
				component: Transitional,
			},
			on: {
				GO_BACK_TO_HOME: {
					target: 'backToHomescreen',
				},
			},
		},
		backToHomescreen: {},
		appearanceTask: {},
	},
} );

export const CustomizeStoreController = ( {
	actionOverrides,
	servicesOverrides,
}: {
	actionOverrides: Partial< typeof customizeStoreStateMachineActions >;
	servicesOverrides: Partial< typeof customizeStoreStateMachineServices >;
} ) => {
	useFullScreen( [ 'woocommerce-customize-store' ] );

	const augmentedStateMachine = useMemo( () => {
		return customizeStoreStateMachineDefinition.withConfig( {
			services: {
				...customizeStoreStateMachineServices,
				...servicesOverrides,
			},
			actions: {
				...customizeStoreStateMachineActions,
				...actionOverrides,
			},
			guards: {
				hasStepInUrl: ( _ctx, _evt, { cond }: { cond: unknown } ) => {
					const { path = '' } = getQuery() as { path: string };
					const pathFragments = path.split( '/' );
					return (
						pathFragments[ 2 ] === // [0] '', [1] 'customize-store', [2] step slug
						( cond as { step: string | undefined } ).step
					);
				},
			},
		} );
	}, [ actionOverrides, servicesOverrides ] );

	const [ state, send, service ] = useMachine( augmentedStateMachine, {
		devTools: process.env.NODE_ENV === 'development',
	} );
	// eslint-disable-next-line react-hooks/exhaustive-deps -- false positive due to function name match, this isn't from react std lib
	const currentNodeMeta = useSelector( service, ( currentState ) =>
		findComponentMeta< CustomizeStoreComponentMeta >(
			currentState?.meta ?? undefined
		)
	);

	const [ CurrentComponent, setCurrentComponent ] =
		useState< CustomizeStoreComponent | null >( null );
	useEffect( () => {
		if ( currentNodeMeta?.component ) {
			setCurrentComponent( () => currentNodeMeta?.component );
		}
	}, [ CurrentComponent, currentNodeMeta?.component ] );

	const currentNodeCssLabel =
		state.value instanceof Object
			? Object.keys( state.value )[ 0 ]
			: state.value;

	return (
		<>
			<div
				className={ `woocommerce-profile-wizard__container woocommerce-profile-wizard__step-${ currentNodeCssLabel }` }
			>
				{ CurrentComponent ? (
					<CurrentComponent
						parentMachine={ service }
						sendEvent={ send }
						context={ state.context }
					/>
				) : (
					<div />
				) }
			</div>
		</>
	);
};

export default CustomizeStoreController;
