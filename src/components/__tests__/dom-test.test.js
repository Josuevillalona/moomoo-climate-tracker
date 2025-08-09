/**
 * Basic DOM test to verify JSDOM is working with real DOM elements
 */

describe('DOM Test', () => {
  beforeEach(() => {
    // Clear any existing elements from the body before each test
    document.body.innerHTML = '';
  });

  it('should have a working DOM environment', () => {
    expect(document).toBeDefined();
    expect(document.body).toBeDefined();
    expect(typeof document.createElement).toBe('function');
    
    // Test with real DOM elements
    const div = document.createElement('div');
    expect(div).toBeDefined();
    expect(div.tagName).toBe('DIV');
    
    // Test property assignment
    div.textContent = 'Hello World';
    expect(div.textContent).toBe('Hello World');
    
    // Test appendChild with real DOM
    document.body.appendChild(div);
    expect(document.body.contains(div)).toBe(true);
  });
  
  it('should be able to create and manipulate DOM elements', () => {
    const container = document.createElement('div');
    container.id = 'test-container';
    
    expect(container.id).toBe('test-container');
    expect(container.tagName).toBe('DIV');
    
    // Test appendChild functionality
    document.body.appendChild(container);
    expect(document.body.contains(container)).toBe(true);
    
    // Test that the element has expected properties
    expect(typeof container.click).toBe('function');
    expect(typeof container.remove).toBe('function');
  });
  
  it('should support DOM element creation and method calls', () => {
    const parent = document.createElement('div');
    parent.className = 'parent';
    
    const child1 = document.createElement('span');
    child1.textContent = 'Child 1';
    
    const child2 = document.createElement('span');
    child2.textContent = 'Child 2';
    
    // Test appendChild method exists and can be called
    parent.appendChild(child1);
    parent.appendChild(child2);
    
    expect(parent.contains(child1)).toBe(true);
    expect(parent.contains(child2)).toBe(true);
    
    // Test element properties
    expect(parent.className).toBe('parent');
    expect(child1.textContent).toBe('Child 1');
    expect(child2.textContent).toBe('Child 2');
    
    // Test that elements have expected methods
    expect(typeof parent.addEventListener).toBe('function');
    expect(typeof parent.removeEventListener).toBe('function');
    expect(typeof parent.setAttribute).toBe('function');
    expect(typeof parent.getAttribute).toBe('function');
  });
  
  it('should support element method calls', () => {
    const element = document.createElement('button');
    
    // Test that all expected methods exist
    expect(typeof element.click).toBe('function');
    expect(typeof element.remove).toBe('function');
    expect(typeof element.addEventListener).toBe('function');
    expect(typeof element.removeEventListener).toBe('function');
    
    // Test method calls work without throwing
    expect(() => element.click()).not.toThrow();
    expect(() => element.setAttribute('disabled', 'true')).not.toThrow();
    expect(() => element.addEventListener('click', jest.fn())).not.toThrow();
    
    // Test that attributes are set correctly
    expect(element.getAttribute('disabled')).toBe('true');
  });
});