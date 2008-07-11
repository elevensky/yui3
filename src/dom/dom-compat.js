//Y.namespace('YAHOO.util');
window.YAHOO = window.YAHOO || {};
YAHOO.util = YAHOO.util || {};

(function() {
    var propertyCache = {};
    var patterns = {
        HYPHEN: /(-[a-z])/i, // to normalize get/setStyle
        ROOT_TAG: /^body|html$/i, // body for quirks mode, html for standards,
        OP_SCROLL:/^(?:inline|table-row)$/i
    };

    var hyphenToCamel = function(property) {
        if ( !patterns.HYPHEN.test(property) ) {
            return property; // no hyphens
        }
        
        if (propertyCache[property]) { // already converted
            return propertyCache[property];
        }
       
        var converted = property;
 
        while( patterns.HYPHEN.exec(converted) ) {
            converted = converted.replace(RegExp.$1,
                    RegExp.$1.substr(1).toUpperCase());
        }
        
        propertyCache[property] = converted;
        return converted;
        //return property.replace(/-([a-z])/gi, function(m0, m1) {return m1.toUpperCase()}) // cant use function as 2nd arg yet due to safari bug
    };

    Y.Dom = {

        get: function(el) {
            if (el) {
                if (el.nodeType || el.item) { // Node, or NodeList
                    return el;
                }

                if (typeof el === 'string') { // id
                    return document.getElementById(el);
                }
                
                if ('length' in el) { // array-like 
                    var c = [];
                    for (var i = 0, len = el.length; i < len; ++i) {
                        c[c.length] = Y.Dom.get(el[i]);
                    }
                    
                    return c;
                }

                return el; // some other object, just pass it back
            }

            return null;
        },

        isAncestor: function(haystack, needle) {
            return Y.DOM.contains(Y.Dom.get(haystack), Y.Dom.get(needle));
        },

        inDocument: function(el) {
            return Y.Dom.isAncestor(Y.config.doc[DOCUMENT_ELEMENT], el);
        },
       
        batch: function(el, method, o, override, args) {
            el = (el && (el.tagName || el.item)) ? el : Y.Dom.get(el); // skip get() when possible 
 
            if (!el || !method) { 
                return false; 
            }  
            if (args) {
                args = Y.Array(args);
            }
            var scope = (override) ? o : window; 
             
            var apply = function(el) {
                if (args) {
                    var tmp = slice.call(args);
                    tmp.unshift(el);
                    return method.apply(scope, tmp);
                } else {
                    return method.call(scope, el, o);
                }
            };

            if (el.tagName || el.length === undefined) { // element or not array-like  
                return apply(el); 
            }  
 
            var collection = []; 
             
            for (var i = 0, len = el.length; i < len; ++i) { 
                collection[collection.length] = apply(el[i]);
            } 
            
            return collection;
        },

        // 2.x returns false if already present
        _addClass: function(el, className) {
            if ( Y.DOM.hasClass(el, className) ) {
                return false;
            }

            Y.DOM.addClass(el, className);
            return true;
        },

        // 2.x returns false if not present
        _removeClass: function(el, className) {
            if ( !Y.DOM.hasClass(el, className) ) {
                return false;
            }

            Y.DOM.removeClass(el, className);
            return true;
        },

        // 2.x returns false if no newClass or same as oldClass
        _replaceClass: function(el, oldClass, newClass) {
            if (!newClass || oldClass === newClass) {
                return false;
            }

            Y.DOM.replaceClass(el, oldClass, newClass);
            return true;
        },

        getElementsByClassName: function(className, tag, root) {
            tag = tag || '*';
            root = (root) ? Y.Dom.get(root) : Y.config.doc; 
            var nodes = [];
            if (root) {
                nodes = Y.Selector.query(tag + '.' + className, root);
            }
            return nodes;
        },

        getElementsBy: function(method, tag, root) {
            tag = tag || '*';
            root = (root) ? Y.Dom.get(root) : null || document;

            var nodes = [];
            if (root) {
                nodes = Y.DOM.byTag(tag, root, method);
            }
            return nodes;
        },

        getViewportWidth: Y.DOM.winWidth,
        getViewportHeight: Y.DOM.winHeight,
        getDocumentWidth: Y.DOM.docWidth,
        getDocumentHeight: Y.DOM.docHeight,
        getDocumentScrollTop: Y.DOM.docScrollY,
        getDocumentScrollLeft: Y.DOM.docScrollX,
        getDocumentHeight: Y.DOM.docHeight,

        _guid: function(el, prefix) {
            prefix = prefix || 'yui-gen';
            Y.Dom._id_counter = Y.Dom._id_counter || 0;

            if (el && el.id) { // do not override existing ID
                return el.id;
            } 

            var id = prefix + Y.Dom._id_counter++;

            if (el) {
                el.id = id;
            }
            
            return id;
        },

        _region: function(el) {
            if ( (el.parentNode === null || el.offsetParent === null ||
                    Y.DOM.getStyle(el, 'display') == 'none') && el != el.ownerDocument.body) {
                return false;
            }

            return Y.DOM.region(el);

        },

        _ancestorByClass: function(element, className) {
            return Y.DOM.ancestor(element, function(el) {
                return Y.DOM.hasClass(el, className);
            });
        },

        _ancestorByTag: function(element, tag) {
            tag = tag.toUpperCase();
            return Y.DOM.ancestor(element, function(el) {
                return el[TAG_NAME].toUpperCase() === tag;
            });
        }
    };

    var slice = [].slice;

    var wrap = function(fn, name) {
        Y.Dom[name] = function() {
            var args = slice.call(arguments);
            args[0] = Y.Dom.get(args[0]);
            return fn.apply(Y.Dom, args);
        };
    };

    var wrapped = {
        getAncestorBy: Y.DOM.ancestor,
        getAncestorByClassName: Y.Dom._ancestorByClass,
        getAncestorByTagName: Y.Dom._ancestorByTag,
        getPreviousSiblingBy: Y.DOM.previous,
        getPreviousSibling: Y.DOM.previous,
        getNextSiblingBy: Y.DOM.next,
        getNextSibling: Y.DOM.next,
        getFirstChildBy: Y.DOM.firstChild,
        getFirstChild: Y.DOM.firstChild,
        getLastChildBy: Y.DOM.lastChild,
        getLastChild: Y.DOM.lastChild,
        getChildrenBy: Y.DOM.children,
        getChildren: Y.DOM.children,
        insertBefore: function(newNode, refNode) {
            Y.DOM.insertBefore(Y.Dom.get(newNode), Y.Dom.get(refNode));
        },
        insertAfter: function(newNode, refNode) {
            Y.DOM.insertAfter(Y.Dom.get(newNode), Y.Dom.get(refNode));
        }
    };

    Y.each(wrapped, wrap);

    var batched = {
        getStyle: Y.DOM.getStyle,
        setStyle: Y.DOM.setStyle,
        getXY: Y.DOM.getXY,
        setXY: Y.DOM.setXY,
        getX: Y.DOM.getX,
        getY: Y.DOM.getY,
        setX: Y.DOM.setX, 
        setY: Y.DOM.setY, 
        getRegion: Y.Dom._region,
        hasClass: Y.DOM.hasClass,
        addClass: Y.Dom._addClass,
        removeClass: Y.Dom._removeClass,
        replaceClass: Y.Dom._replaceClass,
        generateId: Y.Dom._guid
    };

    Y.each(batched, function(v, n) {
        Y.Dom[n] = function(el) {
            var args = slice.call(arguments, 1);
            return Y.Dom.batch(el, v, null, null, args);
        };
    });

    YAHOO.util.Dom = Y.Dom;

    YAHOO.util.Region = function(t, r, b, l) {
        this.top = t;
        this[1] = t;
        this.right = r;
        this.bottom = b;
        this.left = l;
        this[0] = l;
    };

    YAHOO.util.Region.prototype.contains = function(region) {
        return ( region.left   >= this.left   && 
                 region.right  <= this.right  && 
                 region.top    >= this.top    && 
                 region.bottom <= this.bottom    );

        // this.logger.debug("does " + this + " contain " + region + " ... " + ret);
    };

    YAHOO.util.Region.prototype.getArea = function() {
        return ( (this.bottom - this.top) * (this.right - this.left) );
    };

    YAHOO.util.Region.prototype.intersect = function(region) {
        var t = Math.max( this.top,    region.top    );
        var r = Math.min( this.right,  region.right  );
        var b = Math.min( this.bottom, region.bottom );
        var l = Math.max( this.left,   region.left   );
        
        if (b >= t && r >= l) {
            return new YAHOO.util.Region(t, r, b, l);
        } else {
            return null;
        }
    };

    YAHOO.util.Region.prototype.union = function(region) {
        var t = Math.min( this.top,    region.top    );
        var r = Math.max( this.right,  region.right  );
        var b = Math.max( this.bottom, region.bottom );
        var l = Math.min( this.left,   region.left   );

        return new YAHOO.util.Region(t, r, b, l);
    };

    YAHOO.util.Region.prototype.toString = function() {
        return ( "Region {"    +
                 "top: "       + this.top    + 
                 ", right: "   + this.right  + 
                 ", bottom: "  + this.bottom + 
                 ", left: "    + this.left   + 
                 "}" );
    };

    YAHOO.util.Region.getRegion = function(el) {
        return Y.DOM.region(el);
    };

    YAHOO.util.Point = function(x, y) {
       if (YAHOO.lang.isArray(x)) { // accept input from Dom.getXY, Event.getXY, etc.
          y = x[1]; // dont blow away x yet
          x = x[0];
       }
       
        this.x = this.right = this.left = this[0] = x;
        this.y = this.top = this.bottom = this[1] = y;
    };

    YAHOO.util.Point.prototype = new YAHOO.util.Region();

})();
