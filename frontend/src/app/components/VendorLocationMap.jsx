import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Real OpenStreetMap view of vendor pins, driven imperatively.
 *
 * Plain Leaflet rather than react-leaflet: this project is on React 19 and
 * react-leaflet's peer range has lagged React majors, so the wrapper is a
 * standing upgrade hazard for a component this small.
 *
 * Markers are L.divIcon (styled HTML) rather than Leaflet's default marker.
 * The default pulls leaflet/dist/images/marker-icon.png through a relative URL
 * that bundlers rewrite, which is the classic "markers are invisible in prod"
 * bug — a divIcon has no asset to lose.
 */

const INDIA_CENTER = [22.9734, 78.6569];
const INDIA_ZOOM = 4;

const pinIcon = (selected) =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        width:${selected ? 20 : 14}px;height:${selected ? 20 : 14}px;
        background:${selected ? '#4F46E5' : '#0B1528'};
        border:3px solid #fff;border-radius:9999px;
        box-shadow:0 2px 6px rgba(0,0,0,.35);
        transition:all .15s ease;
      "></div>`,
    iconSize: selected ? [20, 20] : [14, 14],
    iconAnchor: selected ? [10, 10] : [7, 7],
  });

const VendorLocationMap = ({ vendors, selectedId, onSelect, className = '' }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const radiusRef = useRef(null);
  // onSelect is called from Leaflet handlers that are bound once; reading it
  // through a ref keeps a fresh callback without rebinding every marker.
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Create the map once. Re-creating it on data changes would reset the user's
  // pan/zoom on every poll.
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return undefined;

    const map = L.map(containerRef.current, {
      center: INDIA_CENTER,
      zoom: INDIA_ZOOM,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapRef.current = map;

    // Leaflet caches the container size at init. This map sits in a responsive
    // grid that reflows at the lg breakpoint, and without this the tiles keep the
    // stale size and render as grey gaps until something forces a redraw.
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);

    // Captured now rather than read in the cleanup: the ref's contents are what
    // this effect owns, and reading refs during teardown is exactly when they
    // may already point somewhere else.
    const markers = markersRef.current;

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      markers.clear();
      radiusRef.current = null;
    };
  }, []);

  // Sync markers to the vendor list.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set();

    vendors.forEach((vendor) => {
      seen.add(vendor.id);
      const position = [vendor.latitude, vendor.longitude];
      let marker = markersRef.current.get(vendor.id);

      if (!marker) {
        marker = L.marker(position, { icon: pinIcon(false) }).addTo(map);
        marker.bindTooltip(vendor.storeName, { direction: 'top', offset: [0, -10] });
        marker.on('click', () => onSelectRef.current?.(vendor.id));
        markersRef.current.set(vendor.id, marker);
      } else {
        marker.setLatLng(position);
      }
    });

    // Drop markers for vendors that are no longer in the list (filtered out).
    markersRef.current.forEach((marker, id) => {
      if (seen.has(id)) return;
      marker.remove();
      markersRef.current.delete(id);
    });
  }, [vendors]);

  // Highlight the selection and draw its service radius.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker, id) => {
      marker.setIcon(pinIcon(id === selectedId));
      if (id === selectedId) marker.setZIndexOffset(1000);
      else marker.setZIndexOffset(0);
    });

    if (radiusRef.current) {
      radiusRef.current.remove();
      radiusRef.current = null;
    }

    const selected = vendors.find((v) => v.id === selectedId);
    if (!selected) return;

    if (selected.serviceRadiusKm > 0) {
      radiusRef.current = L.circle([selected.latitude, selected.longitude], {
        // Leaflet expects metres; the field is stored in kilometres.
        radius: selected.serviceRadiusKm * 1000,
        color: '#4F46E5',
        weight: 1.5,
        dashArray: '4,4',
        fillColor: '#4F46E5',
        fillOpacity: 0.08,
      }).addTo(map);
    }

    map.setView([selected.latitude, selected.longitude], Math.max(map.getZoom(), 11), {
      animate: true,
    });
  }, [selectedId, vendors]);

  // Frame every pin on first load, so the admin is not left staring at an empty
  // ocean when all the vendors happen to sit in one city.
  const framedRef = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || framedRef.current || vendors.length === 0) return;

    const bounds = L.latLngBounds(vendors.map((v) => [v.latitude, v.longitude]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    framedRef.current = true;
  }, [vendors]);

  return <div ref={containerRef} className={className} />;
};

export default VendorLocationMap;
