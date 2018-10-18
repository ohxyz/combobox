import React from 'react';
import ComboBoxList from './combo-box-list.js';
import { componentManager } from '../core/component-manager.js';
import { generateRandomString, setDefault, isDescendant } from '../../helpers/util.js';
import { BaseItem, makeBaseItems } from './data-model.js';

const DEFAULT_NUMBER_OF_STRIKES = 3;

export default class ComboBox extends React.Component {

    constructor( props ) {

        super( props );
        
        this.handleTextInputChange = this.handleTextInputChange.bind( this );
        this.handleSelect = this.handleSelect.bind( this );
        this.handleIconClick = this.handleIconClick.bind( this );
        this.handleClickOutside = this.handleClickOutside.bind( this );
        this.handleTextInputFocus = this.handleTextInputFocus.bind( this );
        this.handleTextInputBlur = this.handleTextInputBlur.bind( this );
        this.handleListItemFocus = this.handleListItemFocus.bind( this );
        this.handleKeyDown = this.handleKeyDown.bind( this );

        this.textInputElement = null;
        this.comboBoxListElement = null;
        this.domElement = null;
        this.itemFocused = null;
        this.isTextInputFocused = false;
        this.text = '';
        this.isIconClicked = false;

        this.state = {

            domElementId: undefined,
            textInputElementId: undefined,
            name: undefined,
            fields: [],
            indexOfFieldsToSort: -1,
            placeholder: '',
            items: [],
            text: '',
            onPropsSelect: new Function(),
            onPropsIconClick: new Function(),
            onPropsChange: new Function(),
            onPropsFocus: new Function(),
            onPropsBlur: new Function(),
            baseItems: [],
            itemsFiltered: [],
            shouldRenderList: false,
            shouldRenderCount: false,
            shouldRenderIcon: true,
            iconStyle: '',
            strikes: DEFAULT_NUMBER_OF_STRIKES

        };
        
        this.id = setDefault( props.id, generateRandomString() );
        componentManager.addComponent( this.id, this );
    }

    static getDerivedStateFromProps( nextProps, prevState ) {

        let numberOfStrikes = parseInt( nextProps.strikes, 10 );

        if ( isNaN( numberOfStrikes ) || numberOfStrikes < 1 ) {

            numberOfStrikes = DEFAULT_NUMBER_OF_STRIKES;
        }
        
        return {

            domElementId: setDefault( nextProps.id, undefined ),
            textInputElementId: setDefault( nextProps.inputId, undefined ),
            name: setDefault( nextProps.name, undefined ),
            items: setDefault( nextProps.items, [] ),
            text: setDefault( nextProps.text, '' ),
            placeholder: setDefault( nextProps.placeholder, ''),
            onPropsSelect: setDefault( nextProps.onSelect, new Function() ),
            onPropsIconClick: setDefault( nextProps.onIconClick, new Function() ),
            onPropsChange: setDefault( nextProps.onChange, new Function() ),
            onPropsFocus: setDefault( nextProps.onFocus, new Function() ),
            onPropsBlur: setDefault( nextProps.onBlur, new Function() ),
            fields: setDefault( nextProps.fields, [] ),
            indexOfFieldsToSort: setDefault( nextProps.indexOfFieldsToSort, -1 ),
            baseItems: makeBaseItems( nextProps.items, nextProps.fields ),
            shouldRenderCount: setDefault( nextProps.shouldRenderCount, false ),
            shouldRenderIcon: setDefault( nextProps.shouldRenderIcon, true ),
            strikes: numberOfStrikes,
            iconStyle: setDefault( nextProps.iconStyle, '' )
        };
    }

    updateItems( items, fields ) {

        let fieldArray = [];

        if ( fields === undefined || Array.isArray( fields ) === false ) {

            fieldArray = this.state.fields;
        }

        let baseItems = makeBaseItems( items, fieldArray );
        let text = this.textInputElement.value;
        let itemsFiltered = this.filterBaseItemsByText( baseItems, text );

        this.setState( { 

            items: items,
            baseItems: baseItems,
            itemsFiltered: itemsFiltered
        } );
    }

    showComboBoxList( items ) {

        if ( Array.isArray( items ) === true && items.length > 0 ) {

            this.setState( { 

                itemsFiltered: items,
                shouldRenderList: true
            } );
        }
    }

    clearComboBoxList() {

        this.setState( { 

            itemsFiltered: [],
            shouldRenderList: false
        } );
    }

    handleTextInputChange( event ) {

        this.itemFocused = null;

        let text = event.target.value;
        let itemsFiltered = [];

        this.text = text;

        if ( text.length < this.state.strikes ) {

            this.clearComboBoxList();
        }
        else { 

            itemsFiltered = this.filterBaseItemsByText( this.state.baseItems, text );

            if ( itemsFiltered.length > 0 ) {

                this.showComboBoxList( itemsFiltered );
            }
            else { 

                this.clearComboBoxList();
            }
        }

        this.state.onPropsChange( this );
    }

    handleTextInputFocus() {

        this.isTextInputFocused = true;

        if ( this.state.itemsFiltered.length > 0 ) {

            this.setState( {

                shouldRenderList: true
            } );
        }

        this.state.onPropsFocus( this );
    }

    handleTextInputBlur() {

        this.isTextInputFocused = false;
        this.state.onPropsBlur( this );
    }

    filterBaseItemsByText( baseItems, text ) {

        let itemsFiltered = [];

        for ( let i = 0; i < baseItems.length; i ++ ) {

            let baseItem = baseItems[ i ];
            let content = baseItem.__content__.toLowerCase();

            if ( content.indexOf( text.toLowerCase() ) >= 0 ) {

                itemsFiltered.push( baseItem );
            }
        }

        return itemsFiltered;
    }

    sortByIndexOfFields( { items, fields, index } ) {

        let indexOfFields = parseInt( index, 10 );

        if ( Array.isArray( fields ) === true 
                && indexOfFields <= fields.length - 1 ) {

            let fieldName = fields[ indexOfFields ];

            items.sort( ( a, b ) => {

                if ( a instanceof BaseItem === true 
                        && b instanceof BaseItem === true ) {

                    return a.__content__.localeCompare( b.__content__ );
                }
                else if ( typeof a !== 'object' || typeof b !== 'object' ) {

                    return false;
                }
                else if ( a.hasOwnProperty( fieldName ) === false 
                            || b.hasOwnProperty( fieldName ) === false ) {

                    return false;
                }
                else {

                    return a[ fieldName ].localeCompare( b[ fieldName ] );
                }

            } );
        }
    }

    handleSelect( item ) {

        this.textInputElement.value = item.__content__;
        this.textInputElement.dataset.text = item.__content__;
        let itemsFiltered = this.filterBaseItemsByText( this.state.baseItems, item.__content__ );

        this.setState( {

            itemsFiltered: itemsFiltered,
            shouldRenderList: false,
        } );

        this.state.onPropsSelect( item, this );
    }

    clearSearch() {

        this.textInputElement.value = '';
        this.textInputElement.dataset.text = '';

        this.clearComboBoxList();
    }

    showAllItems() {

        this.setState( {

            itemsFiltered: this.state.baseItems,
            shouldRenderList: true
        } );
    }

    handleIconClick() {

        this.state.onPropsIconClick( this );
    }

    handleClickOutside( event ) {

        if ( isDescendant( event.target, this.domElement ) === false ){
                        
            this.setState( {

                shouldRenderList: false
            } );
        }
    }

    handleKeyDown( event ) {

        if ( this.isTextInputFocused === false ) {

            return;
        }

        if ( event.key === 'Enter'
                && ( this.itemFocused instanceof BaseItem ) === true ) {

            this.handleSelect( this.itemFocused );
        }
    }

    handleListItemFocus( item ) {

        if ( item instanceof BaseItem === false ) {

            return;
        }

        this.itemFocused = item;
        this.textInputElement.value = item.__content__;
    }

    componentDidMount() {
        
        document.addEventListener( 'mouseup', this.handleClickOutside );
        document.addEventListener( 'keydown', this.handleKeyDown );
    }
    
    componentWillUnmount() {

        document.removeEventListener( 'mouseup', this.handleClickOutside );
        document.removeEventListener( 'keydown', this.handleKeyDown );
    }

    renderCount() {

        if ( this.state.shouldRenderCount === false ) {

            return;
        }

        let count = this.state.itemsFiltered.length;

        return (

            <div className="combo-box__count">
                <span className="combo-box__count-number">{ count }</span>
                <span className="combo-box__count-text"> found</span>
            </div>
        );
    }

    renderIcon() {

        return (

            <span className="combo-box__icon" onClick={ this.handleIconClick }>
                { this.renderIconStyle() }
            </span>
        );
    }

    renderIconStyle() {

        return <span className="combo-box__icon-style">{ this.state.iconStyle }</span>;
    }

    renderHeader() {

        return (

            <div className="combo-box__header">
                <input
                    id={ this.state.textInputElementId }
                    type="text" 
                    className="combo-box__field"
                    name={ this.state.name }
                    data-text={ this.text }
                    placeholder={ this.state.placeholder }
                    onChange={ this.handleTextInputChange }
                    onFocus={ this.handleTextInputFocus }
                    onBlur={ this.handleTextInputBlur }
                    ref={ elem => this.textInputElement = elem }
                />
                { this.renderIcon() }
            </div>
        );
    }

    renderContent() {

        if ( this.state.shouldRenderList === false 
                || this.state.itemsFiltered.length === 0 ) {

            return;
        }

        this.sortByIndexOfFields( {

            items: this.state.itemsFiltered,
            fields: this.state.fields,
            index: this.state.indexOfFieldsToSort

        } );

        return (

            <div className="combo-box__content">
                <ComboBoxList
                    items={ this.state.itemsFiltered }
                    onSelect={ this.handleSelect }
                    onListItemFocus={ this.handleListItemFocus }
                    ref={ elem => { this.comboBoxListElement = elem; } }
                />
            </div>
        );
    }

    render() {

        return (

            <div id={ this.state.domElementId } className="combo-box" ref={ elem => { this.domElement = elem; } } >
                { this.renderCount() }
                { this.renderHeader() }
                { this.renderContent() }
            </div>
        );
    }
}

export {

    ComboBox
};