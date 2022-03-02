//the window type is accessible through the browser
//if the window type is undefined then server-side rendering is true
export const isServer = () => typeof window === 'undefined';

//You only need to server-side render
// 1) if you have dynamic data
// 2) if you have queries on that page
// 3) if the pages content is important to SEO
