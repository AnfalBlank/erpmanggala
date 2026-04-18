import { CRUDPage } from '../CRUDPages.jsx';
export default function Warehouses() {
  return <CRUDPage title="Gudang" endpoint="/warehouses" columns={[{ key: 'name', label: 'Nama' }, { key: 'location', label: 'Lokasi' }]} formFields={[{ key: 'name', label: 'Nama' }, { key: 'location', label: 'Lokasi' }]} />;
}
