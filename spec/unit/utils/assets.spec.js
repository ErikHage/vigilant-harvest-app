import { getAssetPath } from '@/utils/assets';

describe('getAssetPath', () => {
    it('joins a relative path to the asset base path', () => {
        expect(getAssetPath('ai-owl.jpg')).toBe('/assets-test/ai-owl.jpg');
    });

    it('does not double the slash for a path that starts with one', () => {
        expect(getAssetPath('/ai-owl.jpg')).toBe('/assets-test/ai-owl.jpg');
    });
});
