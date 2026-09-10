-- Run after the Prisma schema has been created.
CREATE OR REPLACE FUNCTION protect_master_super_admin()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD."isMasterSuperAdmin" THEN
      RAISE EXCEPTION 'Master Super Admin cannot be deleted';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD."isMasterSuperAdmin" THEN
    IF NEW."role" <> 'SUPER_ADMIN'::"Role" OR NEW."status" <> 'ACTIVE'::"UserStatus" OR NEW."isMasterSuperAdmin" <> TRUE THEN
      RAISE EXCEPTION 'Master Super Admin protection violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_protect_master_super_admin ON "User";
CREATE TRIGGER trg_protect_master_super_admin BEFORE UPDATE OR DELETE ON "User" FOR EACH ROW EXECUTE FUNCTION protect_master_super_admin();
