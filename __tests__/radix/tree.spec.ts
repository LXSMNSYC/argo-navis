import RadixNode from '../../src/radix/node';
import RadixTree from '../../src/radix/tree';


describe('RadixTree', () => {
  describe('constructor', () => {
    test('contains a RadixNode as a root placeholder', () => {
      const tree = new RadixTree();
      expect(tree.root).toBeInstanceOf(RadixNode);
      expect(tree.root.payload).toBeFalsy();
      expect(tree.root.placeholder).toEqual(true);
    });
  });

  describe('#add', () => {
    test('on a new instance, replaces placeholder with a new node', () => {
      const tree = new RadixTree();
      tree.add('/abc', 'abc');

      expect(tree.root).toBeInstanceOf(RadixNode);
      expect(tree.root.placeholder).toEqual(false);
      expect(tree.root.payload).toBeTruthy();
      expect(tree.root.payload).toEqual('abc');
    });

    describe('shared root', () => {
      test('inserts adjacent nodes properly', () => {
        const tree = new RadixTree();
        tree.add('/', 'root');
        tree.add('/a', 'a');
        tree.add('/bc', 'bc');

        expect(tree.root.children.length).toEqual(2);
        expect(tree.root.children[0].key).toEqual('bc');
        expect(tree.root.children[0].payload).toEqual('bc');
        expect(tree.root.children[1].key).toEqual('a');
        expect(tree.root.children[1].payload).toEqual('a');
      });

      test('inserts nodes with shared parent', () => {
        const tree = new RadixTree();
        tree.add('/', 'root');
        tree.add('/abc', 'abc');
        tree.add('/adef', 'adef');

        expect(tree.root.children.length).toEqual(1);
        expect(tree.root.children[0].key).toEqual('a');
        expect(tree.root.children[0].children.length).toEqual(2);
        expect(tree.root.children[0].children[0].key).toEqual('def');
        expect(tree.root.children[0].children[1].key).toEqual('bc');
      });

      test('inserts multiple parent nodes', () => {
        const tree = new RadixTree();
        tree.add('/', 'root');
        tree.add('/admin/1', 'admin/1');
        tree.add('/admin/2', 'admin/2');
        tree.add('/blog/1', 'blog/1');
        tree.add('/blog/2', 'blog/2');

        expect(tree.root.children.length).toEqual(2);

        expect(tree.root.children[0].key).toEqual('admin/');
        expect(tree.root.children[0].payload).toBeFalsy();
        expect(tree.root.children[0].children.length).toEqual(2);
        expect(tree.root.children[0].children[0]).toEqual('1');
        expect(tree.root.children[0].children[1]).toEqual('2');

        expect(tree.root.children[1].key).toEqual('blog/');
        expect(tree.root.children[1].payload).toBeFalsy();
        expect(tree.root.children[1].children.length).toEqual(2);
        expect(tree.root.children[1].children[0]).toEqual('1');
        expect(tree.root.children[1].children[1]).toEqual('2');
      });

      test('inserts multiple nodes with mixed parents', () => {
        const tree = new RadixTree();
        tree.add('/a', 'a');
        tree.add('/a/:b', 'a:b');
        tree.add('/ab', 'ab');
        tree.add('/c', 'c');
      });
    });
  });
});
