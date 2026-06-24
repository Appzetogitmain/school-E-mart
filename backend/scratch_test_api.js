const API_URL = 'http://localhost:7000/api/v1';

async function run() {
  console.log('Sending teacher login request...');
  const loginRes = await fetch(`${API_URL}/auth/school/teacher/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'teacher@school.com',
      password: 'password123'
    })
  });
  console.log('Response Status:', loginRes.status, loginRes.statusText);
  const resData = await loginRes.json();
  console.log('Response Body:', JSON.stringify(resData, null, 2));

  if (loginRes.ok && resData.data) {
    const teacherToken = resData.data.accessToken;
    const schoolId = resData.data.user.tenantSchoolId;

    // 2. Fetch students list
    const listRes = await fetch(`${API_URL}/schools/${schoolId}/students?classGrade=Class%205&section=Section%20A`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${teacherToken}`,
        'Content-Type': 'application/json'
      }
    });
    const listData = await listRes.json();
    console.log('API RESPONSE SUCCESS:', listData.success);
    if (listData.success) {
      console.log(`Fetched ${listData.data.students.length} students from HTTP API.`);
    } else {
      console.error('API Error details:', listData);
    }
  }
}

run().catch(console.error);
