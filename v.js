/** @jsx h */
require("@babel/core").transform("code", {
  presets: ["@babel/preset-react"],
});

/**
 * credit to @deathmood for this medium post:
 * https://medium.com/@deathmood/how-to-write-your-own-virtual-dom-ee74acc13060
 */ 

/**
 * Create POJO from virtual dom tree
 * 
 * @param {*} type
 * @param {*} props
 * @param {*} children
 * @returns 
 */
function h(type, props, ...children) {
  return { type, props: props ?? {}, children };
}

/**
 * Create DOM nodes from virtual dom node
 * 
 * @param {*} node 
 * @returns 
 */
function createElement(node) {
  if (typeof node === 'string') {
    return document.createTextNode(node);
  }
  const $el = document.createElement(node.type);
  setProps($el, node.props);
  addEventListeners($el, node.props);
  node.children
    .map(createElement)
    .forEach($el.appendChild.bind($el));
  return $el;
}

/**
 * Update DOM tree
 * 
 * @param {HTMLElement} $parent 
 * @param {ChildNode} newNode 
 * @param {*} oldNode 
 * @param {Integer} index
 */
function updateElement($parent, newNode, oldNode, index=0) {
  if (!oldNode) {
    // when there is no old node and just need to add new node
    $parent.appendChild(
      createElement(newNode)
    );
  } else if (!newNode) {
    // when we need to remove the old node
    $parent.removeChild(
      $parent.childNodes[index]
    );
  } else if (changed(newNode, oldNode)) {
    // when we replace child
    $parent.replaceChild(
      createElement(newNode), 
      $parent.childNodes[index]
    );
  } else if (newNode.type) {
    updateProps(
      $parent.childNodes[index],
      newNode.props,
      oldNode.props
    );

    // needs to recursively diff children as well
    const newLen = newNode.children.length;
    const oldLen = oldNode.children.length;
    for (let i = 0; i < newLen || i < oldLen; i++) {
      updateElement(
        $parent.childNodes[index],
        newNode.children[i],
        oldNode.children[i],
        i
      )
    }
  }
} 

/**
 * Compare if 2 nodes to see if one changed for both elem
 * and text nodes
 * 
 * @param {*} node1 
 * @param {*} node2 
 * @returns 
 */
function changed(node1, node2) {
  return typeof node1 !== typeof node2 || 
    typeof node1 === 'string' && node1 !== node2 ||
    node1.type !== node2.type ||
    node1.props.forceUpdate; // re adding event listeners
}

/**
 * Setting attributes wrapper
 * 
 * @param {HTMLElement} $target 
 * @param {String} name 
 * @param {*} value 
 */
function setProp($target, name, value) {
  if (isCustomProp(name)) {
    return;
  } else if (name === 'className') {
    // `class` is reserved in JS
    $target.setAttribute('class', value);
  } else if (typeof value === 'boolean') {
    setBooleanProp($target, name, value);
  } else {
    $target.setAttribute(name, value);
  }
}

/**
 * Setting all props 
 * 
 * @param {HTMLElement} $target 
 * @param {*} props 
 */
function setProps($target, props) {
  Object.keys(props).forEach(name => {
    setProp($target, name, props[name])
  })
}

/**
 * Set bool props since it is easier to work with
 * 
 * @param {HTMLElement} $target 
 * @param {*} name 
 * @param {*} value 
 */
function setBooleanProp($target, name, value) {
  if(value) {
    $target.setAttribute(name, value)
    $target[name] = true;
  } else {
    $target[name] = false;
  }
}

/**
 * Edgy case
 * 
 * @param {String} name 
 * @returns 
 */
function isCustomProp(name) {
  return isEventProp(name) || name === 'forceUpdate';
}

/**
 * remove a boolean prop
 * 
 * @param {HTMLElement} $target 
 * @param {*} name 
 */
function removeBooleanProp($target, name) {
  $target.removeAttribute(name);
  $target[name] = false;
}

/**
 * remove a prop
 * 
 * @param {HTMLElement} $target 
 * @param {*} name 
 * @param {*} value 
 * @returns 
 */
function removeProp($target, name, value) {
  if (isCustomProp(name)) {
    return;
  } else if (name === 'className') {
    $target.removeAttribute('class');
  } else if (typeof value === 'boolean') {
    removeBooleanProp($target, name);
  } else {
    $target.removeAttribute(name);
  }
}

/**
 * update a single prop
 * 
 * @param {HTMLElement} $target 
 * @param {*} name 
 * @param {*} newVal 
 * @param {*} oldVal 
 */
function updateProp($target, name, newVal, oldVal) {
  if (!newVal) {
    removeProp($target, name, oldVal)
  } else if (!oldVal || newVal !== oldVal) {
    setProp($target, name, newVal);
  }
}

function updateProps($target, newProps, oldProps = {}) {
  // const props = Object.assign({}, newProps, oldProps); // this will merge undefined
  const props = {...newProps, ...oldProps}; // spread gets rid of undefined
  Object.keys(props).forEach(name => {
    updateProp($target, name, newProps[name], oldProps[name]);
  })
}

// handling events
/**
 * check if it is an event
 * 
 * @param {String} name 
 * @returns 
 */
const isEventProp = (name) => /^on/.test(name);

/**
 * only take event name
 * 
 * @param {String} name 
 * @returns 
 */
const extractEventName = (name) => name.slice(2).toLowerCase();

/**
 * add virtual dom event to real dom nodes
 * 
 * @param {HTMLElement} $target 
 * @param {*} props 
 */
function addEventListeners($target, props) {
  Object.keys(props).forEach(name => {
    if(isEventProp(name)) {
      $target.addEventListener(
        extractEventName(name),
        props[name]
      )
    }
  })
}

const a = (
  <ul className="list">
    <li>item 1</li>
    <li>item 2</li>
  </ul>
);

const b = (
  <ul className="list">
    <li>item 1</li>
    <li>hello!</li>
  </ul>
)

const f = (
  <ul style="list-style: none;">
    <li className="item">item 1</li>
    <li className="item">
      <input type="checkbox" checked={true} />
      <input type="text" disabled={false} />
    </li>
  </ul>
);

const $root = document.getElementById('root');
$root.appendChild(createElement(f));
// const $reload = document.getElementById('reload');

// updateElement($root, a);
// $reload.addEventListener('click', () => {
//   updateElement($root, b, a);
// });
