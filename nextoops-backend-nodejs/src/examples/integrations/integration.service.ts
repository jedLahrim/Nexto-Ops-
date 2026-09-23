import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * IntegrationService handles communication between the application and external business systems.
 *
 * This service acts as a unified adapter layer for three core enterprise platforms:
 *
 * - **ERP (Enterprise Resource Planning)**
 *   A centralized system that manages core business processes such as inventory,
 *   procurement, manufacturing, finance, and supply chain. Common ERP platforms
 *   include SAP, Oracle ERP, and Odoo. In this service, the ERP is the source of
 *   truth for real-time stock/inventory levels.
 *
 * - **CRM (Customer Relationship Management)**
 *   A platform for managing a company's interactions with current and potential
 *   customers. It stores customer profiles, sales pipelines, communication history,
 *   and support tickets. Popular CRM platforms include Salesforce and HubSpot.
 *   This service syncs user data into the CRM to keep customer records up to date.
 *
 * - **PIM (Product Information Management)**
 *   A system that serves as a single source of truth for product data — including
 *   descriptions, specifications, images, pricing, and categorization. PIM ensures
 *   consistent product information is distributed across all sales channels (website,
 *   mobile app, marketplaces). Common PIM solutions include Akeneo and Salsify.
 *   This service pushes product updates from the PIM into the application catalog.
 */
@Injectable()
export class IntegrationService {
  constructor(private readonly httpService: HttpService) { }

  /**
   * Fetches real-time stock/inventory data from the ERP system for a given product.
   *
   * ERP (Enterprise Resource Planning) systems like SAP or Odoo manage inventory
   * across warehouses and locations. This method queries the ERP's stock API to
   * retrieve the current available quantity for a product — ensuring the application
   * always reflects accurate, live inventory rather than stale cached data.
   *
   * @param productId - The unique identifier of the product to look up in the ERP.
   * @returns The stock data object returned by the ERP (e.g., quantity, warehouse location).
   *
   * @example
   * const stock = await integrationService.getStockFromERP('SKU-00123');
   * // stock => { productId: 'SKU-00123', quantity: 42, warehouse: 'WH-EU-01' }
   */
  async getStockFromERP(productId: string) {
    const response = await firstValueFrom(
      this.httpService.get(`https://erp-api.com/v1/stock/${productId}`, {
        headers: { Authorization: `Bearer ${process.env.ERP_TOKEN}` },
      })
    );
    return response.data;
  }

  /**
   * Syncs a customer record to the CRM system.
   *
   * CRM (Customer Relationship Management) platforms like Salesforce or HubSpot
   * maintain a central database of customer profiles, purchase history, and
   * engagement data. This method pushes new or updated user data to the CRM,
   * keeping sales and support teams informed about the customer's activity
   * and enabling personalized outreach and reporting.
   *
   * @param userData - An object containing the customer's data to be synced
   *                   (e.g., name, email, phone, company, account tier).
   * @returns The HTTP response from the CRM API, typically including the created
   *          or updated customer record with a CRM-assigned ID.
   *
   * @example
   * await integrationService.syncCustomerToCRM({
   *   name: 'Jane Doe',
   *   email: 'jane@example.com',
   *   company: 'Acme Corp',
   * });
   */
  async syncCustomerToCRM(userData: any) {
    return await firstValueFrom(
      this.httpService.post('https://crm-api.com/v1/customers', userData)
    );
  }

  /**
   * Pushes updated product data from the PIM system into the application's catalog.
   *
   * PIM (Product Information Management) systems like Akeneo or Salsify act as
   * the single source of truth for all product content — including titles,
   * descriptions, technical specifications, images, videos, and localized content.
   * This method receives a payload from the PIM and syncs it to the application,
   * ensuring that product listings are always accurate and consistent across all
   * sales channels (website, mobile, third-party marketplaces).
   *
   * @param pimData - The product payload from the PIM system, typically containing
   *                  fields like productId, name, description, media assets, and attributes.
   * @returns The HTTP response confirming the catalog update was applied.
   *
   * @example
   * await integrationService.updateProductCatalog({
   *   productId: 'SKU-00123',
   *   name: 'Wireless Headphones Pro',
   *   description: 'Noise-cancelling, 30hr battery life.',
   *   images: ['https://cdn.example.com/img1.jpg'],
   * });
   */
  async updateProductCatalog(pimData: any) {
    return await firstValueFrom(
      this.httpService.put('https://pim-system.com/api', pimData)
    );
  }
}