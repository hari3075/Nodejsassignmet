const express = require('express');
const csvParser = require('csv-parser');
const fs = require('fs');

const app = express();
const port = 3000;

// Load student data from CSV file
const loadStudentData = () => {
    return new Promise((resolve, reject) => {
        const students = [];
        fs.createReadStream('students.csv')
            .pipe(csvParser())
            .on('data', (row) => {
                students.push(row);
            })
            .on('end', () => {
                resolve(students);
            })
            .on('error', (err) => {
                reject(err);
            });
    });
};

// Load Student Details API - Paginated
app.get('/students', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;

        const students = await loadStudentData();
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedStudents = students.slice(startIndex, endIndex);

        res.json({
            page,
            pageSize,
            total: students.length,
            data: paginatedStudents
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Server-side Filtering API
app.get('/students/filter', async (req, res) => {
    try {
        const filterCriteria = req.query.criteria || ''; // Assuming filter criteria are sent as comma-separated values (e.g., name=John,totalMarks>=80)
        const filters = filterCriteria.split(',');

        const students = await loadStudentData();
        const filteredStudents = students.filter(student => {
            return filters.every(filter => {
                const [key, value] = filter.split('=');
                const [field, operator] = key.split(/(?<=[a-zA-Z])(?=[<>!=])/); // Split key into field and operator
                switch (operator) {
                    case undefined:
                    case '=':
                        return student[field] === value;
                    case '>':
                        return student[field] > value;
                    case '>=':
                        return student[field] >= value;
                    case '<':
                        return student[field] < value;
                    case '<=':
                        return student[field] <= value;
                    case '!=':
                        return student[field] !== value;
                    default:
                        return false;
                }
            });
        });

        res.json(filteredStudents);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
