const getExcerpt = (data: string) => {
  return data
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replace(/<\/?[^>]+>/gi, ' ')
    .replaceAll('\n', ' ')
    .replace(/ +/g, ' ')
    .substring(0, 160);
};

export default getExcerpt;
