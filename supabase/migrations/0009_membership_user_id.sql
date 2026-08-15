-- Başvuru sırasında kullanıcı artık kendi şifresini belirliyor; başvuru admin onayından önce
-- oluşturulan auth kullanıcısına bağlanabilsin diye membership_applications'a user_id eklenir.
alter table membership_applications
  add column user_id uuid references auth.users(id) on delete set null;
