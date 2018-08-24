const map = {};

const data = {};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

data.canvas = (res) => {
  const layer = map.element.getLayer('users');
  if (layer) {
    map.element.removeLayer('users');
    map.element.removeSource('users');
  }
  map.element.addLayer({
    id: 'users',
    type: 'circle',
    minzoom: 9,
    source: {
      type: 'geojson',
      data: res,
    },
    paint: {
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff',
      'circle-color': '#d9453d',
      'circle-radius': {
        stops: [
          [10, 3],
          [15, 6],
        ],
      },
    },
  });
};

data.insight = (res) => {
  if (res.features[0]) {
    document.querySelector('.insight-article-banner-image').src = res.features[0].properties.user.avatar;
    document.querySelector('.insight-article-banner-title').textContent = res.features[0].properties.user.username;
    document.querySelector('.insight-article-content').textContent = res.features[0].properties.text;
    document.querySelector('.insight-article-banner-options-link-text').textContent = res.features[0].properties.comments.length;
  }
  return res;
};

data.preview = (res) => {
  const arr = document.querySelectorAll('.view-article');
  if (arr.length !== 0) {
    arr.forEach((el) => {
      el.remove();
    });
  }
  res.features.forEach((el) => {
    const article = document.querySelector('.view-article-template').cloneNode(true);
    article.classList.remove('view-article-template');
    article.classList.add('view-article');
    article.querySelector('.view-article-image').src = el.properties.user.avatar;
    article.querySelector('.view-article-title').textContent = el.properties.user.username;
    article.querySelector('.view-article-content').textContent = el.properties.text;
    article.querySelector('.view-article-location').textContent = el.properties.location;
    article.querySelector('.view-article-location').dataset.lng = el.geometry.coordinates[0];
    article.querySelector('.view-article-location').dataset.lat = el.geometry.coordinates[1];
    article.querySelector('.view-article-link').href = `${el.properties.user.username}/posts/${el._id}`;
    article.querySelector('.view-article-link-text').textContent = el.properties.comments.length;
    article.onclick = insight;
    document.querySelector('.view').appendChild(article);
  });
  return res;
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

map.load = (res) => {
  map.element = new mapboxgl.Map({
    container: 'mapboxgl',
    style: 'https://maps.tilehosting.com/c/d5517948-b81a-4374-9547-6de2bf4279d8/styles/basic/style.json?key=BJinYMSawaKJNsgs0dR4',
    center: res.center,
    zoom: 12,
    maxZoom: 15,
    // maxBounds: res.maxBounds,
    attributionControl: false,
  }).addControl(new mapboxgl.AttributionControl({
    compact: true,
  }), 'bottom-right');

  map.element.doubleClickZoom.disable();
  map.element.scrollZoom.disable();
  map.element.touchZoomRotate.disableRotation();
};

map.listeners = (res) => {
  map.element.once('load', () => data.dbQuery());
  map.element.on('dragstart', () => map.element.once('moveend', () => data.dbQuery()));
  map.element.on('zoomend', () => data.dbQuery());
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

data.formData = () => {
  const fd = new FormData();
  const c = map.element.getCenter();
  fd.append('lat', c.lat);
  fd.append('lng', c.lng);
  const b = map.element.getBounds();
  fd.append('ne_lat', b._ne.lat);
  fd.append('ne_lng', b._ne.lng);
  fd.append('sw_lat', b._sw.lat);
  fd.append('sw_lng', b._sw.lng);
  return fd;
};

data.dbQuery = () => {
  const fd = data.formData();

  fetch('/db-query', {
    method: 'POST',
    credentials: 'same-origin',
    body: fd,
  }).then(res => res.json())
    .then(res => data.preview(res))
    .then(res => data.insight(res))
    .then(res => data.canvas(res))
    .then(() => data.geocode())
    .catch(err => console.log(err));
};

data.geocode = () => {
  const fd = data.formData();

  fetch('/geocode', {
    method: 'POST',
    credentials: 'same-origin',
    body: fd,
  }).then(res => res.json())
    .then((res) => {
      document.querySelector('.header-section-container-title').textContent = res;
      const ask = document.querySelector('.ask-form-textarea');
      if (ask) {
        ask.placeholder = `Ask a question from ${res}.`;
        document.querySelector('.ask-container-title').textContent = res;
      }
    })
    .catch(err => console.log(err));
};

// Get request initialises map settings
fetch('/explore.json', {
  method: 'GET',
  credentials: 'same-origin',
}).then(res => res.json())
  .then(res => map.load(res))
  .then(res => map.listeners())
  .catch(err => console.log(err));
