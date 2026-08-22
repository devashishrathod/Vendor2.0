// src/pages/voucher/index.js
export { default as Voucher } from "./Voucher";
export { default as VoucherDetails } from "./VoucherDetails";
export { default as VoucherFormPage } from "./VoucherFormPage";

// Example route wiring (add inside your <Routes> in App.jsx / router config):
//
// import { Voucher, VoucherDetails, VoucherFormPage } from "./pages/voucher";
//
// <Route path="/vouchers" element={<Voucher />} />
// <Route path="/vouchers/new" element={<VoucherFormPage />} />
// <Route path="/vouchers/:voucherId" element={<VoucherDetails />} />
// <Route path="/vouchers/:voucherId/edit" element={<VoucherFormPage />} />