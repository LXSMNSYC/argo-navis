import RadixNode from '../../src/radix/node';
import RadixResult from '../../src/radix/result';

describe('RadixResult', () => {
  describe('#found', () => {
    test('returns false if no payload is associated', () => {
      const result = new RadixResult();
      expect(result.found).toEqual(false);
    });
    test('returns true with a payload', () => {
      const result = new RadixResult();
      const node = new RadixNode('/', 'root');

      result.use(node);

      expect(result.found).toEqual(true);
    });
  });

  describe('#key', () => {
    test('a new instance returns an empty key', () => {
      expect(new RadixResult().key).toEqual('');
    });
    test('given a single node, returns the key of that node', () => {
      const node = new RadixNode('/', 'root');
      const result = new RadixResult();
      result.use(node);

      expect(result.key).toEqual('/');
    });
    test('given a multiple nodes, returns the combined keys of the nodes', () => {
      const nodes = [
        new RadixNode('/', 'root'),
        new RadixNode('about', 'about'),
      ];

      const result = new RadixResult();
      result.use(nodes[0]);
      result.use(nodes[1]);

      expect(result.key).toEqual('/about');
    });
  });

  describe('#use', () => {
    test('uses the node payload', () => {
      const result = new RadixResult();
      const node = new RadixNode('/', 'root');

      expect(result.payload).toBeFalsy();

      result.use(node);
      expect(result.payload).toBeTruthy();
      expect(result.payload).toEqual(node.payload);
    });

    test('allow not to assing payload', () => {
      const result = new RadixResult();
      const node = new RadixNode('/', 'root');

      expect(result.payload).toBeFalsy();

      result.use(node, false);
      expect(result.payload).toBeFalsy();
    });
  });
});
