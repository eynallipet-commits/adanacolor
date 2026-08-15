-- Cari silme özelliğini mümkün kılmak için: membership_applications.created_company_id FK'i
-- RESTRICT davranışındaydı (varsayılan), onaylanmış her başvuru bu kolonla bir cariye referans
-- verdiğinden bu, ONAYLANMIŞ HİÇBİR carinin asla silinememesine yol açıyordu. profiles.company_id
-- ile aynı deseni (on delete set null) kullanıyoruz.
alter table membership_applications
  drop constraint if exists membership_applications_created_company_id_fkey;
alter table membership_applications
  add constraint membership_applications_created_company_id_fkey
  foreign key (created_company_id) references companies(id) on delete set null;

-- Cari kartında "Yetkili Adı Soyadı" başvurudan otomatik dolsun diye.
alter table companies
  add column contact_name text;
