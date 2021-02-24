CREATE DATABASE mohar_invoice;

CREATE TABLE admin(
    admin_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_username VARCHAR(50) NOT NULL,
    admin_password VARCHAR(50) NOT NULL
);

INSERT INTO admin (admin_username, admin_password) VALUES ('admin', 'admin54321');


CREATE TABLE POS(
    pos_id INT NOT NULL PRIMARY KEY
);
INSERT INTO pos (pos_id) VALUES (345)
CREATE TABLE load_agent(
    load_agent_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_agent_name VARCHAR(50) NOT NULL,
    load_agent_address VARCHAR(50) NOT NULL,
    load_agent_email VARCHAR(50) NOT NULL,
    load_agent_username VARCHAR(50) NOT NULL,
    load_agent_password VARCHAR(50) NOT NULL,
    pos_id INT NOT NULL,
    FOREIGN KEY (pos_id) REFERENCES POS(pos_id)  
);

ALTER TABLE load_agent 
ALTER COLUMN load_agent_password TYPE VARCHAR(250);

INSERT INTO load_agent (load_agent_name, load_agent_address, load_agent_email, load_agent_username, load_agent_password, pos_id ) VALUES ('sita','Lalaitpur','cdf@gmail.com','cdf',345);

ALTER TABLE load_agent 
ADD COLUMN load_agent_PAN VARCHAR(50),
ADD COLUMN load_agent_citizenship_number VARCHAR(50),
ADD COLUMN participants_id VARCHAR(50),
FOREIGN KEY (participants_id) REFERENCES participants(participants_id);


CREATE TABLE inspector(
    inspector_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspector_name VARCHAR(50) NOT NULL,
    inspector_address VARCHAR(50) NOT NULL,
    inspector_email VARCHAR(50) NOT NULL,
    inspector_username VARCHAR(50) NOT NULL,
    inspector_password VARCHAR(50) NOT NULL,
    pos_id INT NOT NULL,
    FOREIGN KEY (pos_id) REFERENCES POS(pos_id)
    
);

CREATE TABLE customer(
    customer_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_type_id uuid NOT NULL,
    customer_name VARCHAR(50) NOT NULL,
    customer_address VARCHAR(50) NOT NULL,
    contact_number VARCHAR(50) NOT NULL,
    card_number VARCHAR(50) NOT NULL,
    FOREIGN KEY (card_type_id) REFERENCES card_type(card_type_id)
);


CREATE TABLE card_sales(
    card_sales_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_agent_id uuid,
    customer_id uuid,
    card_fee NUMERIC(5,2) NOT NULL,
    VAT NUMERIC(5,2) NOT NULL,
    commission NUMERIC(5,2) NOT NULL,
    reload_amount NUMERIC(5,2) NOT NULL,
    total_amount NUMERIC NOT NULL,
    FOREIGN KEY (load_agent_id) REFERENCES load_agent(load_agent_id),
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)   
);

CREATE TABLE card_reload(
    card_reload_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_agent_id uuid,
    customer_id uuid,
    commission NUMERIC(10,2) NOT NULL,
    reload_amount NUMERIC(10,2) NOT NULL,
    total_amount NUMERIC NOT NULL,
    FOREIGN KEY (load_agent_id) REFERENCES load_agent(load_agent_id),
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)   
);

CREATE TABLE penalty_reason(
    penalty_reason_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue VARCHAR(150) NOT NULL,
    penalty_amount INT NOT NULL CHECK (penalty_amount >= 0)
);

INSERT INTO penalty_reason (issue, penalty_amount) VALUES ('Misuse reason 1', 1000);

CREATE TABLE penalty(
    penalty_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspector_id uuid,
    customer_id uuid,
    penalty_reason_id uuid,
    transaction_date TIMESTAMP DEFAULT Now()::timestamp(0),
    FOREIGN KEY (inspector_id) REFERENCES inspector(inspector_id),
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    FOREIGN KEY (penalty_reason_id) REFERENCES penalty_reason(penalty_reason_id)
    
);

CREATE TABLE card_type(
    card_type_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_type VARCHAR(50) NOT NULL
)

INSERT INTO card_type (card_type) VALUES ('Regular');


CREATE TABLE card_sales(
    card_sales_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_agent_id uuid,
    customer_id uuid,
    commission_id uuid,
    receipt_amount NUMERIC(10,2) NOT NULL,
    VAT_on_amount NUMERIC(10,2) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    acquired_commission NUMERIC(10,2) NOT NULL,
    TDS_for_commission NUMERIC(10,2) NOT NULL,
    VAT_for_commission NUMERIC(10,2) NOT NULL,
    amount_for_mohar NUMERIC(10,2) NOT NULL,
    VAT_for_mohar_amount NUMERIC(10,2) NOT NULL,
    final_amount NUMERIC(10,2) NOT NULL,
    transaction_date TIMESTAMP DEFAULT Now()::timestamp(0),
    FOREIGN KEY (load_agent_id) REFERENCES load_agent(load_agent_id),
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    FOREIGN KEY (commission_id) REFERENCES commission(commission_id)   
);

CREATE TABLE commission(
    commission_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    commission_type VARCHAR(50) NOT NULL,
    commission_percentage INT NOT NULL CHECK (commission_percentage >= 0)
);

INSERT INTO commission (commission_type, commission_percentage) VALUES ('Card Sale', 4);
INSERT INTO commission (commission_type, commission_percentage) VALUES ('Card Reload', 2);

CREATE TABLE card_sales_for_TDS(
    card_sales_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_agent_id uuid,
    customer_id uuid,
    commission_id uuid,
    receipt_amount NUMERIC(10,2) NOT NULL,
    VAT_on_amount NUMERIC(10,2) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    acquired_commission NUMERIC(10,2) NOT NULL,
    TDS_for_commission NUMERIC(10,2) NOT NULL,
    amount_for_mohar NUMERIC(10,2) NOT NULL,
    VAT_for_mohar_amount NUMERIC(10,2) NOT NULL,
    final_amount NUMERIC(10,2) NOT NULL,
    transaction_date TIMESTAMP DEFAULT Now()::timestamp(0),
    FOREIGN KEY (load_agent_id) REFERENCES load_agent(load_agent_id),
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    FOREIGN KEY (commission_id) REFERENCES commission(commission_id)   
);


CREATE TABLE card_reload(
    card_reload_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_agent_id uuid,
    customer_id uuid,
    commission_id uuid,
    reload_amount NUMERIC(10,2) NOT NULL,
    service_charge NUMERIC(10,2) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    acquired_commission NUMERIC(10,2) NOT NULL,
    VAT_for_commission NUMERIC(10,2) NOT NULL,
    TDS_for_commission NUMERIC(10,2) NOT NULL,
    final_amount NUMERIC(10,2) NOT NULL,
    transaction_date TIMESTAMP DEFAULT Now()::timestamp(0),
    FOREIGN KEY (load_agent_id) REFERENCES load_agent(load_agent_id),
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    FOREIGN KEY (commission_id) REFERENCES commission(commission_id)   
);
/*
CREATE TABLE card_reload_for_TDS(
    card_reload_for_VAT_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    load_agent_id uuid,
    customer_id uuid,
    commission_id uuid,
    reload_amount NUMERIC(10,2) NOT NULL,
    service_charge NUMERIC(10,2) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    acquired_commission NUMERIC(10,2) NOT NULL,
    TDS_for_commission NUMERIC(10,2) NOT NULL,
    final_amount NUMERIC(10,2) NOT NULL,
    transaction_date TIMESTAMP DEFAULT Now()::timestamp(0),
    FOREIGN KEY (load_agent_id) REFERENCES load_agent(load_agent_id),
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    FOREIGN KEY (commission_id) REFERENCES commission(commission_id)   
);
*/
SELECT load_agent.load_agent_name,
pos.pos_id,
customer.customer_name,
customer.contact_number,
customer.card_number,
card_sales_for_VAT.receipt_amount,
card_sales_for_VAT.VAT_on_amount,
card_sales_for_VAT.total_amount
FROM
card_sales_for_VAT
INNER JOIN load_agent ON load_agent.load_agent_id = card_sales_for_VAT.load_agent_id
INNER JOIN customer ON customer.customer_id = card_sales_for_VAT.customer_id
INNER JOIN pos ON pos.pos_id = load_agent.pos_id;

CREATE TABLE card_info(
    card_number VARCHAR(50) NOT NULL PRIMARY KEY
);

INSERT INTO card_info (card_number) VALUES ('699877445');

SELECT customer.customer_name,
customer.customer_address,
customer.contact_number,
customer.card_number,
card_type.card_type
FROM
customer
INNER JOIN card_type ON card_type.card_type_id = customer.card_type_id
WHERE customer_id = 'fcf2279d-9c94-4815-ab48-65efcf9c937c';

CREATE TABLE participants ( 
    participants_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    participants_type VARCHAR(50) NOT NULL
    );

INSERT INTO participants (participants_type) VALUES ('VAT-registered Load Agent');
INSERT INTO participants (participants_type) VALUES ('VAT-Not-registered Load Agent');
INSERT INTO participants (participants_type) VALUES ('Mohar CSA');


SELECT load_agent.load_agent_name, load_agent.load_agent_username, participants.participants_type 
FROM load_agent 
INNER JOIN participants ON participants.participants_id = load_agent.participants_id
WHERE load_agent_id = $1

SELECT load_agent.load_agent_name, 
pos.pos_id, 
customer.customer_name, 
customer.contact_number, 
card_type.card_type, 
customer.card_number, 
card_sales_for_VAT.receipt_amount, 
card_sales_for_VAT.VAT_on_amount, 
card_sales_for_VAT.total_amount 
FROM card_sales_for_VAT 
INNER JOIN load_agent ON load_agent.load_agent_id = $1 
INNER JOIN customer ON customer.customer_id = $2 
INNER JOIN pos ON pos.pos_id = load_agent.pos_id 
INNER JOIN card_type ON card_type.card_type_id = customer.card_type_id 
WHERE card_sales_for_VAT.card_sales_id = $3

SELECT inspector.inspector_name,
pos.pos_id,
customer.customer_name,
customer.contact_number,
card_type.card_type,
customer.card_number,
penalty_reason.issue,
penalty_reason.penalty_amount,
penalty.transaction_date
FROM penalty
INNER JOIN inspector ON inspector.inspector_id = penalty.inspector_id
INNER JOIN customer ON customer.customer_id = penalty.customer_id
INNER JOIN pos ON pos.pos_id = inspector.pos_id
INNER JOIN card_type ON card_type.card_type_id = customer.card_type_id
INNER JOIN penalty_reason ON penalty_reason.penalty_reason_id = penalty.penalty_reason_id

ALTER TABLE inspector
ADD COLUMN inspector_PAN VARCHAR(50),
ADD COLUMN inspector_citizenship_number VARCHAR(50);

ALTER TABLE inspector ALTER COLUMN inspector_citizenship_number SET NOT NULL;

UPDATE inspector SET inspector_citizenship_number = '456/789' WHERE inspector_id = '807f2a3c-086d-48ab-a719-a923050b7a25';
ALTER TABLE inspector ALTER COLUMN inspector_citizenship_number SET NOT NULL;

SELECT customer.customer_id, customer.customer_name, customer.customer_address, customer.card_number, card_type.card_type, customer.contact_number 
FROM customer 
INNER JOIN card_type ON card_type.card_type_id = customer.card_type_id 
WHERE customer.card_number = $1

ALTER TABLE card_info
ADD COLUMN remarks VARCHAR(50);

SELECT card_sales.card_sales_id
customer.customer_name,
card_type.card_type, 
customer.card_number, 
card_sales.acquired_commission, 
card_sales.tds_for_commission, 
card_sales.vat_for_commission,
card_sales.transaction_date
FROM card_sales 
INNER JOIN customer ON customer.customer_id = card_sales.customer_id
INNER JOIN card_type ON card_type.card_type_id = customer.card_type_id
WHERE load_agent_id = $3

SELECT card_reload.card_reload_id
customer.customer_name,
card_type.card_type, 
customer.card_number, 
card_reload.acquired_commission, 
card_reload.tds_for_commission, 
card_reload.vat_for_commission,
card_reload.transaction_date
FROM card_reload 
INNER JOIN customer ON customer.customer_id = card_sales.customer_id
INNER JOIN card_type ON card_type.card_type_id = customer.card_type_id
WHERE load_agent_id = $3

SELECT penalty.penalty_id,
pos.pos_id,
customer.customer_name,
card_type.card_type,
customer.card_number,
penalty_reason.issue,
penalty_reason.penalty_amount,
penalty.transaction_date
FROM penalty
INNER JOIN inspector ON inspector.inspector_id = penalty.inspector_id
INNER JOIN customer ON customer.customer_id = penalty.customer_id
INNER JOIN pos ON pos.pos_id = inspector.pos_id
INNER JOIN card_type ON card_type.card_type_id = customer.card_type_id
INNER JOIN penalty_reason ON penalty_reason.penalty_reason_id = penalty.penalty_reason_id
WHERE penalty.inspector_id = $1