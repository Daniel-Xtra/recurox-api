// import { Injectable, NestMiddleware } from '@nestjs/common';
// import type { Request, Response, NextFunction } from 'express';
// import { TenantContextService } from '../../modules/tenants/tenant-context.service';
// import { TenantsService } from '../../modules/tenants/tenants.service';

// @Injectable()
// export class TenantContextMiddleware implements NestMiddleware {
//   constructor(
//     private readonly tenantContext: TenantContextService,
//     private readonly tenantsService: TenantsService,
//   ) {}

//   async use(req: Request, _res: Response, next: NextFunction) {
//     const tenantExternalId = req.headers['x-tenant-id'] as string;

//     if (tenantExternalId) {
//       try {
//         const tenant = await this.tenantsService.findByExternalId(tenantExternalId);
//         if (tenant) {
//           // Resolve the full TenantContext object
//           this.tenantContext.setContext({
//             externalId: tenant.externalId,
//             id: tenant.id,
//           });
//         }
//       } catch (error) {
//         // Silent fail to allow the Guard to handle unauthorized/forbidden access
//       }
//     }

//     next();
//   }
// }
