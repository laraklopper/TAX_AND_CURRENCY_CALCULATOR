# INTEREST

## TABLE OF CONTENTS

1. [OVERVIEW](#1-overview)
2. [INTEREST RATE](#2-interest-rate)
    -  [2.1.SOUTH AFRICAN INTEREST RATE](#21-south-african-interest-rate)
3. [TYPES OF INTEREST](#3-types-of-interest)
    - [3.1. SIMPLE INTEREST](#31-simple-interest)
    - [3.2. COMPOUND INTEREST](#32-compound-interest)
4. [HOW TO CALCULATE INTEREST IN THE APPLICATION](#4-how-to-calculate-interest-in-the-application)
5. [REFERENCES](#5-references)

---
## 1. OVERVIEW

#### **Definition**
Interest is a charge for borrowing money, typically expressed as a percentage of the principal amount borrowed. For lenders, it's the compensation for temporarily parting with their funds.

- [InterestCalculatorForm.js]('../client/src/components/InterestCalculatorForm.js')
## 2. INTEREST RATE

### 2.1. SOUTH AFRICAN INTEREST RATE

## 3. TYPES OF INTEREST


### 3.1. SIMPLE INTEREST

- Simple interest is worked out on the principal, or original, amount of a loan

**Simple Interest Formula**
The formula for calculating simple interest is:​
​
Simple interest = P x i x n ​
where:​
P = Principle​
i = interest rate ​
n = term of the loan​
​   ​
As a result, if simple interest is charged at 5% on a R10,000 loan that is taken out for three years, the total amount of interest payable by the borrower is calculated as:​
​
 R10,000 x 0.05 x 3 = R1,500.​
​
Interest on this loan is payable at R500 per year, or R1,500 over the three-year loan term.


### 3.2. COMPOUND INTEREST

- Compound interest is calculated on the principal (original) amount and also on the added interest of previous periods.

**Compound Interest Formula**
The method used to calculate compound interest in a year is:​
Compound interest = [P(1+i)ⁿ] − P​
Compound interest = P[(1+i)ⁿ − 1]​
where:​
P = Principle​
i = interest rate in percentage terms​
n = number of compounding periods for one year​
​  ​
﻿Compound Interest = Total amount of Principal and Interest in the future (or Future Value) less the Principal amount at present called Present Value (PV). PV is the present worth of a future amount of money or stream of cash flows given a definite rate of return. Carrying on with the simple interest example, what would the interest amount be if it is charged on a compound basis? In this case, it would be:​
​
R10,000 [(1 + 0.05)³ – 1] = R10,000 [1.157625 – 1] = R1,576.25​
​
While the total interest payable over the 3-year period of this loan is R1,576.25, unlike simple interest, the interest amount is not the same for all 3 years because compound interest also takes into consideration collected interest of previous periods.


## 4. HOW TO CALCULATE INTEREST IN THE APPLICATION

The application includes a form to allow users to calculate  simple interest and compound interest (monthly or annually). Users are also able to save interesr

[InterestCalculator](../client/src/components/InterestCalculatorForm.js)

## 5. REFERENCES

- https://www.jse.co.za/learn-how-to-invest/what-interest
- https://tradingeconomics.com/south-africa/interest-rate
- https://www.investopedia.com/terms/i/interest.asp