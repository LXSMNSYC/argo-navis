import DuplicateError from '../../src/radix/exceptions/duplicate-error';
import RadixNode from '../../src/radix/node';
import RadixTree from '../../src/radix/tree';
import SharedKeyError from '../../src/radix/exceptions/shared-key-error';

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

    /**
     * New instance
     */
    test('on a new instance, replaces placeholder with a new node', () => {
      const tree = new RadixTree();
      tree.add('/abc', 'abc');

      expect(tree.root).toBeInstanceOf(RadixNode);
      expect(tree.root.placeholder).toEqual(false);
      expect(tree.root.payload).toBeTruthy();
      expect(tree.root.payload).toEqual('abc');
    });

    /**
     * Shared roots
     */
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
        expect(tree.root.children[0].children[0].key).toEqual('1');
        expect(tree.root.children[0].children[1].key).toEqual('2');

        expect(tree.root.children[1].key).toEqual('blog/');
        expect(tree.root.children[1].payload).toBeFalsy();
        expect(tree.root.children[1].children.length).toEqual(2);
        expect(tree.root.children[1].children[0].key).toEqual('1');
        expect(tree.root.children[1].children[1].key).toEqual('2');
      });

      test('inserts multiple nodes with mixed parents', () => {
        const tree = new RadixTree();
        tree.add('/abc', 'abc');
        tree.add('/abc/:d', 'abc:d');
        tree.add('/ad', 'ad');
        tree.add('/cde', 'cde');

        expect(tree.root.children.length).toEqual(2);
        expect(tree.root.children[1].key).toEqual('a');
        expect(tree.root.children[1].children.length).toEqual(2);
        expect(tree.root.children[1].children[0].payload).toEqual('abc');
        expect(tree.root.children[1].children[1].payload).toEqual('ad');
      });

      test('supports insertion of mixed routes out of order', () => {
        const tree = new RadixTree();

        tree.add('/page/setting', 'page/setting');
        tree.add('/pages/:page/setting', 'pages/:page/setting');
        tree.add('/pages/:page', 'pages/:page');
        tree.add('/page', 'page');

        expect(tree.root.key).toEqual('/page');
        expect(tree.root.payload).toEqual('page');
        expect(tree.root.children.length).toEqual(2);
        expect(tree.root.children[0].key).toEqual('/setting');
        expect(tree.root.children[1].key).toEqual('s/:page');
        expect(tree.root.children[1].payload).toEqual('pages/:page');
        expect(tree.root.children[1].children[0].key).toEqual('/setting');
      });
    });

    describe('mixed payload', () => {
      test('allows node with different payloads', () => {
        const payloads = [
          'Hello',
          1234,
          'World',
        ];

        const tree = new RadixTree();
        tree.add('/', payloads[0]);
        tree.add('/ab', payloads[1]);
        tree.add('/cde', payloads[2]);

        expect(tree.root.children.length).toEqual(2);
        expect(tree.root.children[0].key).toEqual('cde');
        expect(tree.root.children[0].payload).toEqual(payloads[2]);
        expect(tree.root.children[1].key).toEqual('ab');
        expect(tree.root.children[1].payload).toEqual(payloads[1]);
      });
    });

    describe('dealing with unicode', () => {
      test('inserts properly adjacent parent nodes', () => {
        const tree = new RadixTree();
        tree.add('/', 'root');
        tree.add('/こんにちは', 'japanese_hello');
        tree.add('/你好', 'chinese_hello');

        expect(tree.root.children.length).toEqual(2);
        expect(tree.root.children[0].key).toEqual('こんにちは');
        expect(tree.root.children[1].key).toEqual('你好');
      });

      test('inserts nodes with shared parent', () => {
        const tree = new RadixTree();
        tree.add('/', 'root');
        tree.add('/おはようございます', 'good morning');
        tree.add('/おやすみなさい', 'good night');

        expect(tree.root.children.length).toEqual(1);
        expect(tree.root.children[0].key).toEqual('お');
        expect(tree.root.children[0].children.length).toEqual(2);
        expect(tree.root.children[0].children[0].key).toEqual('はようございます');
        expect(tree.root.children[0].children[1].key).toEqual('やすみなさい');
      });
    });

    test('does not allow defining the same path twice', () => {
      const tree = new RadixTree();
      tree.add('/', 'root');
      tree.add('/abc', 'abc');

      expect(() => {
        tree.add('/', 'root');
      }).toThrow(DuplicateError);

      expect(tree.root.children.length).toEqual(1);
    });

    describe('dealing with named and glob parameters', () => {
      test('prioritizes node correctly', () => {
        const tree = new RadixTree();
        tree.add('/', 'root');
        tree.add('/*file', 'all');
        tree.add('/a', 'a');
        tree.add('/a/:b', 'a/:b');
        tree.add('/a/:b/c', 'a/:b/c');
        tree.add('/a/b', 'a/b');

        expect(tree.root.children.length).toEqual(2);
        expect(tree.root.children[0].key).toEqual('a');
        expect(tree.root.children[1].key).toEqual('*file');

        const node = tree.root.children[0].children[0].children;
        expect(node.length).toEqual(2);
        expect(node[0].key).toEqual('b');
        expect(node[1].key).toEqual(':b');
        expect(node[1].children[0].key).toEqual('/c');
      });

      test('does not split named parameters across shared key', () => {
        const tree = new RadixTree();
        tree.add('/', 'root');
        tree.add('/:tree', 'tree');
        tree.add('/:tree/:sub', 'subtree');

        expect(tree.root.children.length).toEqual(1);
        expect(tree.root.children[0].key).toEqual(':tree');

        expect(tree.root.children[0].children.length).toEqual(1);
        expect(tree.root.children[0].children[0].key).toEqual('/:sub');
      });

      test('does allow same named parameter in different order of insertion', () => {
        const tree = new RadixTree();
        tree.add('/a/:b/c', 'c');
        tree.add('/a/d', 'd');
        tree.add('/a/:b/e', 'e');

        expect(tree.root.key).toEqual('/a/');
        expect(tree.root.children.length).toEqual(2);

        expect(tree.root.children[0].key).toEqual('d');
        expect(tree.root.children[1].key).toEqual(':b/');

        expect(tree.root.children[1].children[0].key).toEqual('c');
        expect(tree.root.children[1].children[1].key).toEqual('e');
      });

      test('does not allow different named parameters at the same level.', () => {
        const tree = new RadixTree();
        tree.add('/', 'root');
        tree.add('/:a', 'a');

        expect(() => {
          tree.add('/:b', 'b');
        }).toThrow(SharedKeyError);
      });
    });
  });

  describe('#find', () => {
    describe('single node', () => {
      test('result.found should be false when using a different path', () => {
        const tree = new RadixTree();
        tree.add('/a', 'a');

        const result = tree.find('/b');
        expect(result.found).toEqual(false);
      });

      test('finds when key and path matches', () => {
        const tree = new RadixTree();
        tree.add('/a', 'a');

        const result = tree.find('/a');
        expect(result.found).toEqual(true);
        expect(result.key).toEqual('/a');
        expect(result.payload).toEqual('a');
      });

      test('matches when path has trailing slash', () => {
        const tree = new RadixTree();
        tree.add('/a', 'a');

        const result = tree.find('/a/');
        expect(result.found).toEqual(true);
        expect(result.key).toEqual('/a');
        expect(result.payload).toEqual('a');
      });

      test('matches when key has trailing slash', () => {
        const tree = new RadixTree();
        tree.add('/a/', 'a');

        const result = tree.find('/a');
        expect(result.found).toEqual(true);
        expect(result.key).toEqual('/a/');
        expect(result.payload).toEqual('a');
      });
    });

    describe('shared parent', () => {
      test('finds matching path', () => {
        const tree = new RadixTree();
        tree.add('/', 'root');
        tree.add('/abc', 'bc');
        tree.add('/axyz', 'xyz');

        const result = tree.find('/abc');
        expect(result.found).toEqual(true);
        expect(result.key).toEqual('/abc');
        expect(result.payload).toEqual('bc');
      });
    });

    describe('unicode nodes with shared parent', () => {
      test('finds matching path', () => {
        const tree = new RadixTree();
        tree.add('/', 'root');
        tree.add('/おはようございます', 'good morning');
        tree.add('/おやすみなさい', 'good night');

        const result = tree.find('/おはようございます');
        expect(result.found).toEqual(true);
        expect(result.key).toEqual('/おはようございます');
        expect(result.payload).toEqual('good morning');
      });
    });

    describe('dealing with glob', () => {
      test('matches path, with parameters', () => {
        const tree = new RadixTree();
        tree.add('/', 'root');
        tree.add('/*all', 'all');
        tree.add('/about', 'about');

        const result = tree.find('/a/bc');
        expect(result.found).toEqual(true);
        expect(result.key).toEqual('/*all');
        expect(result.payload).toEqual('all');
        expect(result.params.all).toEqual('a/bc');
      });

      test('returns optional catch all', () => {
        const tree = new RadixTree();
        tree.add('/', 'root');
        tree.add('/a/*b', 'b');

        const result = tree.find('/a');
        expect(result.found).toEqual(true);
        expect(result.key).toEqual('/a/*b');
        expect(result.params.b).toBeFalsy();
      });
    });
  });
});
