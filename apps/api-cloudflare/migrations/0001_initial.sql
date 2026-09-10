PRAGMA foreign_keys=ON;

-- Al Ghaly Cloudflare D1 initial schema.

CREATE TABLE IF NOT EXISTS "CustomField" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "entity" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'TEXT',
  "required" INTEGER NOT NULL DEFAULT 0,
  "options" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Permission" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Page" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "published" INTEGER NOT NULL DEFAULT 1,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Integration" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "provider" TEXT NOT NULL UNIQUE,
  "enabled" INTEGER NOT NULL DEFAULT 0,
  "config" TEXT,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "CRMActivity" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "type" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT,
  "dueAt" TEXT,
  "completedAt" TEXT,
  "leadId" TEXT,
  "dealId" TEXT,
  "userId" TEXT,
  "metadata" TEXT,
  "createdAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Setting" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "value" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT "text",
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Conversation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT UNIQUE,
  "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "avatarUrl" TEXT,
  "isMasterSuperAdmin" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "ConversationMember" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "conversationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "CustomFieldValue" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "fieldId" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  FOREIGN KEY ("fieldId") REFERENCES "CustomField"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "RolePermission" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "role" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  "userId" TEXT,
  "enabled" INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "BackupConfig" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "enabled" INTEGER NOT NULL DEFAULT 0,
  "schedule" TEXT NOT NULL DEFAULT "0 2 * * *",
  "retentionDays" INTEGER NOT NULL DEFAULT 30,
  "destination" TEXT,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Client" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "companyName" TEXT,
  "whatsapp" TEXT,
  "country" TEXT,
  "city" TEXT,
  "address" TEXT,
  "website" TEXT,
  "notes" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Service" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "imageUrl" TEXT,
  "duration" TEXT,
  "price" REAL,
  "active" INTEGER NOT NULL DEFAULT 1,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "metadata" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'IN_APP',
  "readAt" TEXT,
  "metadata" TEXT,
  "createdAt" TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Message" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "conversationId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "body" TEXT,
  "type" TEXT NOT NULL DEFAULT 'TEXT',
  "fileId" TEXT,
  "readAt" TEXT,
  "createdAt" TEXT NOT NULL,
  FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" TEXT,
  "userId" TEXT,
  "createdAt" TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "Employee" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "employeeNumber" TEXT NOT NULL UNIQUE,
  "jobTitle" TEXT,
  "department" TEXT,
  "supervisorId" TEXT,
  "hireDate" TEXT,
  "status" TEXT NOT NULL DEFAULT "ACTIVE",
  "skills" TEXT,
  "evaluation" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Project" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "projectNumber" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PLANNED',
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  "startDate" TEXT,
  "dueDate" TEXT,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "clientId" TEXT,
  "assigneeId" TEXT,
  "supervisorId" TEXT,
  "serviceId" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL,
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "Ticket" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ticketNumber" TEXT NOT NULL UNIQUE,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  "clientId" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "Lead" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "company" TEXT,
  "source" TEXT,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "notes" TEXT,
  "ownerId" TEXT,
  "clientId" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "Invoice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "invoiceNumber" TEXT NOT NULL UNIQUE,
  "clientId" TEXT,
  "projectId" TEXT,
  "serviceId" TEXT,
  "subtotal" REAL NOT NULL DEFAULT 0,
  "discount" REAL NOT NULL DEFAULT 0,
  "tax" REAL NOT NULL DEFAULT 0,
  "total" REAL NOT NULL DEFAULT 0,
  "paid" REAL NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT "USD",
  "paymentMethod" TEXT,
  "issuedAt" TEXT NOT NULL,
  "dueAt" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdById" TEXT,
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL,
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL,
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "ProjectComment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Task" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'TODO',
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  "dueDate" TEXT,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "projectId" TEXT,
  "assigneeId" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "AppRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "requestNumber" TEXT NOT NULL UNIQUE,
  "appName" TEXT NOT NULL,
  "idea" TEXT,
  "description" TEXT,
  "businessType" TEXT,
  "targetAudience" TEXT,
  "country" TEXT,
  "language" TEXT,
  "logoUrl" TEXT,
  "colors" TEXT,
  "features" TEXT,
  "appTypes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "progress" INTEGER NOT NULL DEFAULT 0,
  "clientId" TEXT,
  "serviceId" TEXT,
  "projectId" TEXT,
  "assigneeId" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL,
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL,
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "Deal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "value" REAL,
  "stage" TEXT NOT NULL DEFAULT "NEW",
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "expectedClose" TEXT,
  "leadId" TEXT,
  "clientId" TEXT,
  "ownerId" TEXT,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL,
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL,
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "FileAsset" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "url" TEXT,
  "mimeType" TEXT,
  "size" INTEGER,
  "data" BLOB,
  "folder" TEXT,
  "clientId" TEXT,
  "projectId" TEXT,
  "taskId" TEXT,
  "ticketId" TEXT,
  "uploadedById" TEXT,
  "createdAt" TEXT NOT NULL,
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL,
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL,
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL,
  FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "TaskComment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "taskId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_role_permissionId_userId_key" ON "RolePermission" ("role","permissionId","userId");

CREATE INDEX IF NOT EXISTS "RolePermission_permissionId_idx" ON "RolePermission" ("permissionId");

CREATE INDEX IF NOT EXISTS "Client_userId_idx" ON "Client" ("userId");

CREATE INDEX IF NOT EXISTS "Employee_userId_idx" ON "Employee" ("userId");

CREATE INDEX IF NOT EXISTS "Project_clientId_idx" ON "Project" ("clientId");

CREATE INDEX IF NOT EXISTS "Project_serviceId_idx" ON "Project" ("serviceId");

CREATE INDEX IF NOT EXISTS "ProjectComment_projectId_idx" ON "ProjectComment" ("projectId");

CREATE INDEX IF NOT EXISTS "ProjectComment_userId_idx" ON "ProjectComment" ("userId");

CREATE INDEX IF NOT EXISTS "Task_projectId_idx" ON "Task" ("projectId");

CREATE INDEX IF NOT EXISTS "TaskComment_taskId_idx" ON "TaskComment" ("taskId");

CREATE INDEX IF NOT EXISTS "TaskComment_userId_idx" ON "TaskComment" ("userId");

CREATE INDEX IF NOT EXISTS "Ticket_clientId_idx" ON "Ticket" ("clientId");

CREATE UNIQUE INDEX IF NOT EXISTS "CustomField_entity_key_key" ON "CustomField" ("entity","key");

CREATE UNIQUE INDEX IF NOT EXISTS "CustomFieldValue_fieldId_entityId_key" ON "CustomFieldValue" ("fieldId","entityId");

CREATE INDEX IF NOT EXISTS "CustomFieldValue_fieldId_idx" ON "CustomFieldValue" ("fieldId");

CREATE INDEX IF NOT EXISTS "FileAsset_clientId_idx" ON "FileAsset" ("clientId");

CREATE INDEX IF NOT EXISTS "FileAsset_projectId_idx" ON "FileAsset" ("projectId");

CREATE INDEX IF NOT EXISTS "FileAsset_taskId_idx" ON "FileAsset" ("taskId");

CREATE INDEX IF NOT EXISTS "FileAsset_ticketId_idx" ON "FileAsset" ("ticketId");

CREATE UNIQUE INDEX IF NOT EXISTS "ConversationMember_conversationId_userId_key" ON "ConversationMember" ("conversationId","userId");

CREATE INDEX IF NOT EXISTS "ConversationMember_conversationId_idx" ON "ConversationMember" ("conversationId");

CREATE INDEX IF NOT EXISTS "ConversationMember_userId_idx" ON "ConversationMember" ("userId");

CREATE INDEX IF NOT EXISTS "Message_conversationId_idx" ON "Message" ("conversationId");

CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification" ("userId");

CREATE INDEX IF NOT EXISTS "Lead_clientId_idx" ON "Lead" ("clientId");

CREATE INDEX IF NOT EXISTS "Deal_leadId_idx" ON "Deal" ("leadId");

CREATE INDEX IF NOT EXISTS "Deal_clientId_idx" ON "Deal" ("clientId");

CREATE INDEX IF NOT EXISTS "AppRequest_clientId_idx" ON "AppRequest" ("clientId");

CREATE INDEX IF NOT EXISTS "AppRequest_serviceId_idx" ON "AppRequest" ("serviceId");

CREATE INDEX IF NOT EXISTS "AppRequest_projectId_idx" ON "AppRequest" ("projectId");

CREATE INDEX IF NOT EXISTS "Invoice_clientId_idx" ON "Invoice" ("clientId");

CREATE INDEX IF NOT EXISTS "Invoice_projectId_idx" ON "Invoice" ("projectId");

CREATE INDEX IF NOT EXISTS "Invoice_serviceId_idx" ON "Invoice" ("serviceId");

CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog" ("userId");
