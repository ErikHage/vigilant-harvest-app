import { loadFonts } from '@/plugins/webfontloader';

// The real webfontloader, so the dynamic import's interop is tested too. It
// asks Google for the fonts with a stylesheet link, which jsdom doesn't fetch
describe('loadFonts', () => {
    afterEach(() => {
        document.head.querySelectorAll('link').forEach(link => link.remove());
    });

    it("links Google's stylesheet for every weight of Roboto", async () => {
        await loadFonts();

        const links = [...document.head.querySelectorAll('link[rel="stylesheet"]')].map(l => l.href);
        expect(links).toEqual(['https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900&display=swap']);
    });
});
