import { CRUDPage } from '../CRUDPages.jsx';
export default function Taxes() {
  return <CRUDPage title="Pajak" endpoint="/taxes" columns={[{key:'name',label:'Nama'},{key:'rate',label:'Tarif (%)'},{key:'type',label:'Tipe'}]} formFields={[{key:'name',label:'Nama'},{key:'rate',label:'Tarif (%)',type:'number'},{key:'type',label:'Tipe',type:'select',options:['Output','Input','Withholding','Income Tax']}]} />;
}
