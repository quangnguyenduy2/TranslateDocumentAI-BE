-- Insert 4 roles: Admin, Leader, Dev, Tester
INSERT INTO roles (id, name, permissions, "createdAt") VALUES
('00000000-0000-0000-0000-000000000001', 'admin', '["all"]', NOW()),
('00000000-0000-0000-0000-000000000002', 'leader', '["view_users", "manage_projects", "view_analytics"]', NOW()),
('00000000-0000-0000-0000-000000000003', 'dev', '["translate", "upload_files", "view_history"]', NOW()),
('00000000-0000-0000-0000-000000000004', 'tester', '["translate", "upload_files", "report_bugs"]', NOW())
ON CONFLICT (name) DO NOTHING;

-- Example: Update first user to admin (replace with your actual user ID)
-- UPDATE users SET "roleId" = '00000000-0000-0000-0000-000000000001' WHERE email = 'admin@example.com';
