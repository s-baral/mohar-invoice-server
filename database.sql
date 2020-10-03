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
    customer_name VARCHAR(50) NOT NULL,
    customer_address VARCHAR(50) NOT NULL,
    card_number VARCHAR(50) NOT NULL,
    card_type VARCHAR(50) NOT NULL
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
    commission NUMERIC(5,2) NOT NULL,
    reload_amount NUMERIC(5,2) NOT NULL,
    total_amount NUMERIC NOT NULL,
    FOREIGN KEY (load_agent_id) REFERENCES load_agent(load_agent_id),
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)   
);