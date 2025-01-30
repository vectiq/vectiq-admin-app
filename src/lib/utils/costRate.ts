import { SystemConfig } from '@/types';

export function calculateCostRate(salary: number, config: SystemConfig): number {
  try {
    // Validate inputs
    if (!config.costRateFormula) {
      throw new Error('Cost rate formula not configured');
    }

    if (!salary || salary <= 0) {
      throw new Error('Invalid salary amount');
    }

    // Validate required config values
    if (typeof config.payrollTaxPercentage !== 'number') {
      throw new Error('Payroll tax percentage not configured');
    }

    if (typeof config.insurancePercentage !== 'number') {
      throw new Error('Insurance percentage not configured');
    }

    if (typeof config.superannuationPercentage !== 'number') {
      throw new Error('Superannuation percentage not configured');
    }

    // Create a context object with all variables
    const context = {
      salary,
      payrollTaxPercentage: config.payrollTaxPercentage / 100, // Convert to decimal
      payrollTaxFreeThreshold: config.payrollTaxFreeThreshold,
      insurancePercentage: config.insurancePercentage / 100,
      superannuationPercentage: config.superannuationPercentage / 100
    };

    // Replace variables in formula with their values
    let formula = config.costRateFormula;
    Object.entries(context).forEach(([key, value]) => {
      if (typeof value !== 'number' || !isFinite(value)) {
        throw new Error(`Invalid value for ${key}`);
      }
      formula = formula.replace(new RegExp(`{${key}}`, 'g'), value.toString());
    });

    // Evaluate the formula
    try {
      // Validate formula syntax
      if (!/^[\d\s+\-*/.(){}]+$/.test(formula)) {
        throw new Error('Formula contains invalid characters');
      }

      const calculate = new Function('return ' + formula);
      const result = calculate();

      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Formula evaluation did not result in a valid number');
      }

      // Round to 2 decimal places
      return Math.round(result * 100) / 100;
    } catch (evalError) {
      throw new Error(`Invalid cost rate formula: ${evalError.message}`);
    }
  } catch (error) {
    console.error('Error calculating cost rate:', error);
    throw error;
  }
}