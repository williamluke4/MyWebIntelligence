"use strict";

var React = require('react');

var Tabs = require('react-tabs-component');

var Header = require('./Header');

/*

interface TerritoireViewScreenProps{
    currentUser: MyWIUser,
    territoire: MyWITerritoire
    moveToOraclesScreen: () => void
}

*/


module.exports = React.createClass({
    getInitialState: function() {
        return {}
    },
    
    render: function() {
        var props = this.props;
        var territoire = props.territoire;
        console.log('Territoire view', props);
        
        var state = this.state;
        
        return React.DOM.div({className: "react-wrapper"}, [
            new Header({
                 user: state.currentUser,
                 moveToOraclesScreen: props.moveToOracleScreen
            }),
            
            React.DOM.main({className: 'territoire'}, [
                //React.DOM.h1({}, ),
                React.DOM.h1({}, [
                    "Territoire "+territoire.name
                ]),
                
                React.DOM.div({className: 'tabs-and-exports'}, [
                    new Tabs({
                        defaultTabNum: 0,
                        tabNames: ['Pages', 'Domains'],
                        classPrefix: 'tabs-'
                    }, [
                        // Pages tab content
                        territoire.resultList ? React.DOM.ul({className: 'result-list'}, territoire.resultList.map(function(r){
                            return React.DOM.li({}, [
                                React.DOM.a({ href: r.url, target: '_blank' }, [
                                    React.DOM.h3({}, r.title),
                                    React.DOM.h4({}, r.url)
                                ]),
                                React.DOM.div({ className: 'excerpt' }, r.excerpt)
                            ]);
                        })) : undefined,
                        // Domains tab content
                        territoire.resultList ? React.DOM.ul({className: 'result-list'}, territoire.resultList.slice(0, 2).map(function(r){
                            return React.DOM.li({}, [
                                React.DOM.a({ href: r.url, target: '_blank' }, [
                                    React.DOM.h3({}, r.title),
                                    React.DOM.h4({}, r.url)
                                ]),
                                React.DOM.div({ className: 'excerpt' }, r.excerpt)
                            ]);
                        })) : undefined
                    ]),
                    
                    React.DOM.div({className: 'exports'}, [
                        React.DOM.a({href: "/territoire/"+territoire.id+"/expressions.csv"}, 'Download Pages CSV'),
                        React.DOM.a({href: "/territoire/"+territoire.id+"/expressions.gexf"}, 'Download Pages GEXF'),
                        React.DOM.a({href: "/territoire/"+territoire.id+"/domains.gexf"}, 'Download Domains GEXF')
                    ])
                
                ])
                
                
                
                
                
            ])
        
        ]);
    }
});
