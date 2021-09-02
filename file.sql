CREATE TABLE user_info(username VARCHAR(25), password VARCHAR(20)):
CREATE TABLE user_details(username VARCHAR(25),bpay INTEGER, hra INTEGER, lta INTEGER, fa INTEGER, invest INTEGER, rent INTEGER, medi INTEGER, metro BOOLEAN);

INSERT INTO TABLE user_info(username, password) VALUES ("ankur", "ankur@2021");
INSERT INTO TABLE user_details(username, bpay, hra, lta, fa, invest, rent, medi, metro) VALUES("ankur", 100000,5000, 5000, 5000, 10000, 8000, 10000, true); 
select * from user_details;
