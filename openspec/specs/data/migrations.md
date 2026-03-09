# Migraciones de Base de Datos - PickyApp

## 1. Estrategia

Se utiliza el sistema de migraciones de **TypeORM** para versionar el esquema de la base de datos.

-   **Generación**: Automática basada en cambios en entities + manual para casos complejos
-   **Ejecución**: Automática al inicio de la aplicación en desarrollo, manual en producción
-   **Versionado**: Timestamp en el nombre del archivo (YYYYMMDDHHMMSS)

## 2. Flujo de Trabajo

### 2.1 Desarrollo Local

1.  **Realizar cambios en el modelo de datos** (entities):
```typescript
// src/modules/catalog/entities/product.entity.ts
@Entity('products')
export class Product {
  // Agregar nuevo campo
  @Column({ name: 'sku', length: 50, nullable: true })
  sku?: string;
}
```

2.  **Generar archivo de migración**:
```bash
npm run migration:generate -- src/migrations/AddSkuToProducts
```

3.  **Revisar la migración generada**:
```typescript
// src/migrations/1234567890-AddSkuToProducts.ts
export class AddSkuToProducts1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('products', new TableColumn({
      name: 'sku',
      type: 'varchar',
      length: '50',
      isNullable: true
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('products', 'sku');
  }
}
```

4.  **Aplicar migración en entorno local**:
```bash
npm run migration:run
```

5.  **Verificar cambios**:
```bash
# Ver estado de migraciones
npm run migration:show

# Conectar a DB y verificar
psql -d pickyapp_dev -c "\d products"
```

6.  **Commit del archivo de migración**:
```bash
git add src/migrations/1234567890-AddSkuToProducts.ts
git commit -m "feat(db): add sku field to products"
```

### 2.2 Producción

1.  **Backup de la base de datos**:
```bash
pg_dump -U postgres -d pickyapp_prod > backup_$(date +%Y%m%d_%H%M%S).sql
```

2.  **Ejecutar migraciones manualmente**:
```bash
npm run migration:run
```

3.  **Verificar que la aplicación funciona correctamente**

4.  **Si hay problemas, revertir**:
```bash
npm run migration:revert
```

## 3. Comandos Disponibles

### package.json scripts
```json
{
  "scripts": {
    "migration:generate": "typeorm migration:generate -d src/config/typeorm.config.ts",
    "migration:create": "typeorm migration:create",
    "migration:run": "typeorm migration:run -d src/config/typeorm.config.ts",
    "migration:revert": "typeorm migration:revert -d src/config/typeorm.config.ts",
    "migration:show": "typeorm migration:show -d src/config/typeorm.config.ts"
  }
}
```

### Uso
```bash
# Generar migración automática
npm run migration:generate -- src/migrations/NombreMigracion

# Crear migración vacía (para casos complejos)
npm run migration:create -- src/migrations/NombreMigracion

# Ejecutar migraciones pendientes
npm run migration:run

# Revertir última migración
npm run migration:revert

# Ver estado de migraciones
npm run migration:show
```

## 4. Buenas Prácticas

### 4.1 Nombres Descriptivos
```
✅ CORRECTO:
- AddSkuToProducts
- CreateOrdersTable
- AddIndexToProductsName
- RenameDeliveryTypeToDeliveryMethod

❌ INCORRECTO:
- UpdateDB
- Changes
- Fix
- Migration1
```

### 4.2 Migraciones Atómicas
Cada migración debe hacer UNA cosa:
```typescript
// ✅ CORRECTO: Una migración por cambio
// 1234567890-AddSkuToProducts.ts
// 1234567891-AddIndexToProductsSku.ts

// ❌ INCORRECTO: Múltiples cambios no relacionados
// 1234567890-UpdateProductsAndOrders.ts
```

### 4.3 Migraciones Reversibles
Siempre implementar `down()` para poder revertir:
```typescript
export class AddSkuToProducts1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('products', new TableColumn({
      name: 'sku',
      type: 'varchar',
      length: '50',
      isNullable: true
    }));
  }

  // ✅ Implementar down() para revertir
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('products', 'sku');
  }
}
```

### 4.4 Nunca Modificar Migraciones Aplicadas
```
❌ NUNCA hacer esto:
1. Migración aplicada en staging/producción
2. Modificar el archivo de migración
3. Re-ejecutar

✅ En su lugar:
1. Crear una NUEVA migración con el cambio
```

### 4.5 Migraciones Idempotentes
Para operaciones que pueden fallar, usar condicionales:
```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // Verificar si la columna ya existe
  const table = await queryRunner.getTable('products');
  const hasSkuColumn = table?.columns.find(col => col.name === 'sku');
  
  if (!hasSkuColumn) {
    await queryRunner.addColumn('products', new TableColumn({
      name: 'sku',
      type: 'varchar',
      length: '50',
      isNullable: true
    }));
  }
}
```

### 4.6 Separar Schema de Data
```typescript
// ✅ CORRECTO: Migración de schema
// 1234567890-CreateCategoriesTable.ts
export class CreateCategoriesTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table({
      name: 'categories',
      columns: [...]
    }));
  }
}

// ✅ CORRECTO: Seed de datos (separado)
// src/seeds/categories.seed.ts
export class CategoriesSeed {
  async run() {
    // Insertar datos de ejemplo
  }
}
```

## 5. Casos Comunes

### 5.1 Agregar Columna
```typescript
export class AddEmailToUsers1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('users', new TableColumn({
      name: 'email',
      type: 'varchar',
      length: '255',
      isNullable: false,
      isUnique: true
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'email');
  }
}
```

### 5.2 Crear Índice
```typescript
export class AddIndexToProductsName1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndex('products', new TableIndex({
      name: 'IDX_products_name',
      columnNames: ['name']
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('products', 'IDX_products_name');
  }
}
```

### 5.3 Renombrar Columna
```typescript
export class RenamePhoneToWhatsapp1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn('tenants', 'phone', 'whatsapp_number');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn('tenants', 'whatsapp_number', 'phone');
  }
}
```

### 5.4 Migración de Datos
```typescript
export class MigrateOldOrderStatus1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Actualizar datos existentes
    await queryRunner.query(`
      UPDATE orders 
      SET status = 'confirmed' 
      WHERE status = 'accepted'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE orders 
      SET status = 'accepted' 
      WHERE status = 'confirmed'
    `);
  }
}
```

### 5.5 Agregar Foreign Key
```typescript
export class AddCategoryFkToProducts1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createForeignKey('products', new TableForeignKey({
      name: 'FK_products_category',
      columnNames: ['category_id'],
      referencedTableName: 'categories',
      referencedColumnNames: ['id'],
      onDelete: 'CASCADE'
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('products', 'FK_products_category');
  }
}
```

## 6. Configuración TypeORM

### typeorm.config.ts
```typescript
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'pickyapp_dev',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false, // ❌ NUNCA true en producción
  logging: process.env.NODE_ENV === 'development'
});
```

## 7. Troubleshooting

### Error: "Migration already exists"
```bash
# Ver migraciones aplicadas
npm run migration:show

# Si la migración está duplicada, eliminar el archivo duplicado
rm src/migrations/1234567890-DuplicateMigration.ts
```

### Error: "Cannot run migrations, database is not in sync"
```bash
# Opción 1: Generar migración con los cambios pendientes
npm run migration:generate -- src/migrations/SyncDatabase

# Opción 2: Revertir cambios en entities y aplicar migraciones
npm run migration:run
```

### Revertir múltiples migraciones
```bash
# Revertir las últimas 3 migraciones
npm run migration:revert
npm run migration:revert
npm run migration:revert
```

## 8. Checklist Pre-Deploy

Antes de desplegar a producción:

- [ ] Backup de la base de datos realizado
- [ ] Migraciones testeadas en staging
- [ ] Método `down()` implementado y testeado
- [ ] No hay cambios de schema sin migración
- [ ] Migraciones son idempotentes
- [ ] Plan de rollback documentado
- [ ] Tiempo de downtime estimado (si aplica)
