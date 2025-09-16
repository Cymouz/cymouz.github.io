const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const username = "cy.mouz";
  const url = `https://www.instagram.com/${username}/?__a=1&__d=dis`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!res.ok) {
      return { statusCode: res.status, body: res.statusText };
    }

    const data = await res.json();

    const posts = data.graphql.user.edge_owner_to_timeline_media.edges.map(edge => ({
      image: edge.node.display_url,
      caption: edge.node.edge_media_to_caption.edges[0]?.node.text || '',
      link: `https://www.instagram.com/p/${edge.node.shortcode}/`
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(posts)
    };
  } catch (err) {
    return { statusCode: 500, body: err.toString() };
  }
};
