# CrediBlock

Plataforma de microcrédito sobre Hedera que conecta prestamistas con prestatarios sin historial crediticio. El capital de los prestamistas queda invertido en un FCI y solo su rendimiento se presta.

## Language

**Prestamista**:
Persona que aporta capital al Pool y puede retirarlo íntegro en cualquier momento.
_Avoid_: Inversor, lender, depositante

**Prestatario**:
Persona sin historial crediticio que recibe préstamos financiados con el Rendimiento.
_Avoid_: Deudor, borrower, cliente

**Pool**:
Conjunto común del Capital aportado por los Prestamistas y del Rendimiento que genera.
_Avoid_: Fondo, bóveda

**Capital**:
Monto aportado por los Prestamistas; nunca se presta ni absorbe pérdidas.
_Avoid_: Principal, depósito

**FCI**:
Fondo Común de Inversión donde se invierte el Capital; en el mock se simula con rendimiento fijo.
_Avoid_: Fondo de inversión, vault

**Rendimiento**:
Ganancia que genera el FCI sobre el Capital; es lo único que se presta y lo único que absorbe pérdidas. Si no alcanza, se frenan los Préstamos nuevos.
_Avoid_: Intereses del fondo, yield

**Préstamo**:
Monto financiado con Rendimiento y entregado a un Prestatario, devuelto en cuotas con interés.
_Avoid_: Crédito, loan

**Interés**:
Cargo que paga el Prestatario sobre un Préstamo; la mitad se reparte a los Prestamistas por prorrata de Capital y la otra mitad vuelve al Rendimiento.
_Avoid_: Comisión, tasa

**Límite**:
Monto máximo que un Prestatario puede recibir en su próximo Préstamo; arranca mínimo y crece con cada cuota pagada.
_Avoid_: Cupo, score

**Historial**:
Registro inmutable en HCS de las cuotas pagadas y de las moras de un Prestatario; es portable.
_Avoid_: Score, reputación

**Mora**:
Falta de pago de una cuota; la pérdida se descuenta del Rendimiento y el Prestatario queda marcado en su Historial y su Límite pasa a cero.
_Avoid_: Default, impago
