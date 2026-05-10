import db from './db/init.js';

export function getOpenAPISpec() {
  return {
    openapi: '3.0.0',
    info: { title: 'ERP Manggala API', version: '1.0.0', description: 'API Documentation for ERP Manggala - PT Manggala Utama Indonesia' },
    servers: [{ url: '/api', description: 'Current server' }],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      schemas: {
        Error: { type: 'object', properties: { error: { type: 'string' } } },
        LoginRequest: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string' }, password: { type: 'string' } } },
        LoginResponse: { type: 'object', properties: { token: { type: 'string' }, user: { type: 'object' } } },
        Project: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, client_id: { type: 'integer' }, status: { type: 'string' }, start_date: { type: 'string' }, end_date: { type: 'string' }, value: { type: 'number' } } },
        Customer: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, address: { type: 'string' } } },
        Invoice: { type: 'object', properties: { id: { type: 'integer' }, number: { type: 'string' }, client_id: { type: 'integer' }, date: { type: 'string' }, due_date: { type: 'string' }, subtotal: { type: 'number' }, tax: { type: 'number' }, total: { type: 'number' }, status: { type: 'string' } } },
        Employee: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, position: { type: 'string' }, email: { type: 'string' }, phone: { type: 'string' }, basic_salary: { type: 'number' }, status: { type: 'string' } } },
        InventoryItem: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, sku: { type: 'string' }, category: { type: 'string' }, unit: { type: 'string' }, stock: { type: 'number' }, min_stock: { type: 'number' }, price: { type: 'number' }, avg_cost: { type: 'number' } } },
        Payroll: { type: 'object', properties: { id: { type: 'integer' }, employee_id: { type: 'integer' }, period: { type: 'string' }, basic_salary: { type: 'number' }, allowances: { type: 'number' }, deductions: { type: 'number' }, net_salary: { type: 'number' }, status: { type: 'string' } } },
        Attendance: { type: 'object', properties: { id: { type: 'integer' }, employee_id: { type: 'integer' }, date: { type: 'string' }, check_in: { type: 'string' }, check_out: { type: 'string' }, status: { type: 'string' }, late_minutes: { type: 'integer' }, penalty_amount: { type: 'number' } } },
        JournalEntry: { type: 'object', properties: { id: { type: 'integer' }, date: { type: 'string' }, description: { type: 'string' }, debit_account: { type: 'string' }, credit_account: { type: 'string' }, amount: { type: 'number' } } },
        BankAccount: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, bank: { type: 'string' }, account_number: { type: 'string' }, balance: { type: 'number' } } },
      }
    },
    paths: {
      // Auth
      '/auth/login': { post: { tags: ['Auth'], summary: 'Login', requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } }, responses: { '200': { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } } } } },
      '/auth/me': { get: { tags: ['Auth'], summary: 'Get current user', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Current user info' } } } },

      // Users
      '/users': { get: { tags: ['Users'], summary: 'List users', security: [{ bearerAuth: [] }], description: 'Super Admin only', responses: { '200': { description: 'List of users' } } }, post: { tags: ['Users'], summary: 'Create user', security: [{ bearerAuth: [] }], description: 'Super Admin only', responses: { '200': { description: 'User created' } } } },
      '/users/{id}': { put: { tags: ['Users'], summary: 'Update user', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'User updated' } } }, delete: { tags: ['Users'], summary: 'Delete user', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'User deleted' } } } },

      // Projects
      '/projects': { get: { tags: ['Projects'], summary: 'List projects', security: [{ bearerAuth: [] }], parameters: [{ name: 'search', in: 'query', schema: { type: 'string' } }, { name: 'status', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'List of projects' } } }, post: { tags: ['Projects'], summary: 'Create project', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Project created' } } } },
      '/projects/{id}': { get: { tags: ['Projects'], summary: 'Get project', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Project details' } } }, put: { tags: ['Projects'], summary: 'Update project', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Project updated' } } }, delete: { tags: ['Projects'], summary: 'Delete project', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Project deleted' } } } },
      '/projects/{id}/budgets': { get: { tags: ['Projects'], summary: 'Get project budgets', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Budget list' } } }, post: { tags: ['Projects'], summary: 'Add budget item', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Budget added' } } } },
      '/projects/{id}/budget-summary': { get: { tags: ['Projects'], summary: 'Budget summary', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Budget summary' } } } },

      // Invoices
      '/invoices': { get: { tags: ['Invoices'], summary: 'List invoices', security: [{ bearerAuth: [] }], responses: { '200': { description: 'List of invoices' } } }, post: { tags: ['Invoices'], summary: 'Create invoice', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Invoice created' } } } },
      '/invoices/{id}': { put: { tags: ['Invoices'], summary: 'Update invoice', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Invoice updated' } } }, delete: { tags: ['Invoices'], summary: 'Delete invoice', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Invoice deleted' } } } },

      // Inventory
      '/inventory/items': { get: { tags: ['Inventory'], summary: 'List inventory items', security: [{ bearerAuth: [] }], parameters: [{ name: 'search', in: 'query', schema: { type: 'string' } }, { name: 'category', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'List of items' } } }, post: { tags: ['Inventory'], summary: 'Create item', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Item created' } } } },
      '/inventory/items/{id}': { get: { tags: ['Inventory'], summary: 'Get item', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Item details' } } }, put: { tags: ['Inventory'], summary: 'Update item', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Item updated' } } }, delete: { tags: ['Inventory'], summary: 'Delete item', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Item deleted' } } } },
      '/inventory_receipts': { get: { tags: ['Inventory'], summary: 'List receipts', security: [{ bearerAuth: [] }], responses: { '200': { description: 'List of receipts' } } }, post: { tags: ['Inventory'], summary: 'Create receipt', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Receipt created' } } } },
      '/inventory_issues': { get: { tags: ['Inventory'], summary: 'List issues', security: [{ bearerAuth: [] }], responses: { '200': { description: 'List of issues' } } }, post: { tags: ['Inventory'], summary: 'Create issue', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Issue created' } } } },

      // HRD
      '/employees': { get: { tags: ['HRD'], summary: 'List employees', security: [{ bearerAuth: [] }], responses: { '200': { description: 'List of employees' } } }, post: { tags: ['HRD'], summary: 'Create employee', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Employee created' } } } },
      '/attendance': { get: { tags: ['HRD'], summary: 'List attendance', security: [{ bearerAuth: [] }], parameters: [{ name: 'date', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Attendance records' } } }, post: { tags: ['HRD'], summary: 'Create attendance', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Attendance created' } } } },
      '/attendance/{id}': { put: { tags: ['HRD'], summary: 'Update attendance', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Attendance updated' } } } },
      '/leaves': { get: { tags: ['HRD'], summary: 'List leave requests', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Leave requests' } } }, post: { tags: ['HRD'], summary: 'Create leave request', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Leave created' } } } },
      '/leaves/{id}': { put: { tags: ['HRD'], summary: 'Approve/reject leave', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Leave updated' } } } },
      '/shifts': { get: { tags: ['HRD'], summary: 'List shifts', security: [{ bearerAuth: [] }], responses: { '200': { description: 'List of shifts' } } }, post: { tags: ['HRD'], summary: 'Create shift', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Shift created' } } } },
      '/payroll': { get: { tags: ['Finance'], summary: 'List payroll', security: [{ bearerAuth: [] }], parameters: [{ name: 'period', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Payroll records' } } }, post: { tags: ['Finance'], summary: 'Create payroll entry', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Payroll created' } } } },
      '/payroll/generate': { post: { tags: ['Finance'], summary: 'Generate payroll for period', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Payroll generated' } } } },
      '/payroll/{id}': { put: { tags: ['Finance'], summary: 'Update payroll', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { '200': { description: 'Payroll updated' } } } },

      // Finance
      '/banking/transactions': { get: { tags: ['Banking'], summary: 'List transactions', security: [{ bearerAuth: [] }], parameters: [{ name: 'type', in: 'query', schema: { type: 'string' } }, { name: 'account_id', in: 'query', schema: { type: 'integer' } }], responses: { '200': { description: 'Transactions list' } } }, post: { tags: ['Banking'], summary: 'Create transaction', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Transaction created' } } } },
      '/bank_accounts': { get: { tags: ['Banking'], summary: 'List bank accounts', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Bank accounts' } } }, post: { tags: ['Banking'], summary: 'Create bank account', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Account created' } } } },
      '/journals': { get: { tags: ['Finance'], summary: 'List journal entries', security: [{ bearerAuth: [] }], parameters: [{ name: 'from', in: 'query', schema: { type: 'string' } }, { name: 'to', in: 'query', schema: { type: 'string' } }], responses: { '200': { description: 'Journal entries' } } } },
      '/coa_accounts': { get: { tags: ['Finance'], summary: 'List COA', security: [{ bearerAuth: [] }], responses: { '200': { description: 'COA list' } } } },
      '/fixed_assets': { get: { tags: ['Finance'], summary: 'List fixed assets', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Fixed assets' } } } },
      '/taxes': { get: { tags: ['Finance'], summary: 'List taxes', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Tax list' } } } },

      // Purchasing
      '/purchase-requests': { get: { tags: ['Purchasing'], summary: 'List purchase requests', security: [{ bearerAuth: [] }], responses: { '200': { description: 'PR list' } } }, post: { tags: ['Purchasing'], summary: 'Create PR', security: [{ bearerAuth: [] }], responses: { '200': { description: 'PR created' } } } },
      '/purchase-orders': { get: { tags: ['Purchasing'], summary: 'List purchase orders', security: [{ bearerAuth: [] }], responses: { '200': { description: 'PO list' } } }, post: { tags: ['Purchasing'], summary: 'Create PO', security: [{ bearerAuth: [] }], responses: { '200': { description: 'PO created' } } } },

      // Notifications
      '/notifications': { get: { tags: ['Notifications'], summary: 'List notifications', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Notifications' } } } },

      // Search
      '/search': { get: { tags: ['Search'], summary: 'Global search', security: [{ bearerAuth: [] }], parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Search results' } } } },

      // Settings
      '/settings': { get: { tags: ['Admin'], summary: 'Get settings', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Settings' } } }, put: { tags: ['Admin'], summary: 'Update settings', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Settings updated' } } } },
      '/reports/dashboard': { get: { tags: ['Admin'], summary: 'Dashboard data', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Dashboard stats' } } } },

      // Email
      '/email/send': { post: { tags: ['Notifications'], summary: 'Send email', security: [{ bearerAuth: [] }], description: 'Admin+', responses: { '200': { description: 'Email sent' } } } },
      '/email/test': { post: { tags: ['Notifications'], summary: 'Test email config', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Test result' } } } },

      // WhatsApp
      '/whatsapp/send': { post: { tags: ['Notifications'], summary: 'Send WhatsApp message', security: [{ bearerAuth: [] }], responses: { '200': { description: 'Message sent' } } } },
    }
  };
}

export function getSwaggerHTML() {
  return `<!DOCTYPE html>
<html>
<head>
  <title>ERP Manggala API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>body { margin: 0; }</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({ url: "/api-docs.json", dom_id: '#swagger-ui' });
  </script>
</body>
</html>`;
}
