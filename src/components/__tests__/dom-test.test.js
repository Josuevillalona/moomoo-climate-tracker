/**
 * Basic DOM test to verify JSDOM is working
 */

describe('DOM Test', () => {
  it('should have a working DOM environment', () => {
    expect(document).toBeDefined();
    expect(document.body).toBeDefined();
    expect(typeof document.createElement).toBe('function');
    
    const div = document.createElement('div');
    expect(div).toBeDefined();
    expect(div.tagName).toBe('DIV');
    
    div.textContent = 'Hello World';
    expect(div.textContent).toBe('Hello World');
    
    document.body.appendChild(div);
    expect(document.body.children.length).toBe(1);
  });
  
  it('should be able to create and manipulate DOM elements', () => {
    const container = document.createElement('div');
    container.id = 'test-container';
    
    expect(container.id).toBe('test-container');
    expect(container instanceof HTMLElement).toBe(true);
    
    document.body.appendChild(container);
    const found = document.getElementById('test-container');
    expect(found).toBe(container);
  });
});