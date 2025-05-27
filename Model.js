function deg2rad(angle) {
    return angle * Math.PI / 180;
}

function Vertex(p)
{
    this.p = p;
    this.normal = [];
    this.triangles = [];
}

function Triangle(v0, v1, v2)
{
    this.v0 = v0;
    this.v1 = v1;
    this.v2 = v2;
    this.normal = [];
    this.tangent = [];
}

function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iTexCoordBuffer = gl.createBuffer();
    this.iIndexBuffer = gl.createBuffer();
    this.count = 0;
    this.hasTexCoords = false;

    this.BufferData = function(vertices, indices, texCoords) {
        // Buffer vertex data
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STREAM_DRAW);
        
        // Buffer texture coordinate data if provided
        if (texCoords) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexCoordBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STREAM_DRAW);
            this.hasTexCoords = true;
        } else {
            this.hasTexCoords = false;
        }
    
        // Buffer index data
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STREAM_DRAW);
    
        this.count = indices.length;
    }

    this.Draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        
        if (this.hasTexCoords && shProgram.iAttribTexCoord >= 0) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.iTexCoordBuffer);
            gl.vertexAttribPointer(shProgram.iAttribTexCoord, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(shProgram.iAttribTexCoord);
        } else if (shProgram.iAttribTexCoord >= 0) {
            gl.disableVertexAttribArray(shProgram.iAttribTexCoord);
        }
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_SHORT, 0);
    }

    this.DrawWireframe = function() {
        // Bind vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        // Bind index buffer and draw
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        for (let p=0; p<this.count; p+=3)
            gl.drawElements(gl.LINE_LOOP, 3, gl.UNSIGNED_SHORT, p*2);
    }
}

function CreateSurfaceData(data)
{
    let vertices = [];
    let triangles = [];

    for (let i=0, ang = 0; i<72; i++, ang+=5) {
        vertices.push( new Vertex( [Math.sin(deg2rad(ang)), 0, Math.cos(deg2rad(ang))] ));
    }

    for (let i=0, ang = 0; i<72; i++, ang+=5) {

        let v0ind = vertices.length;
        vertices.push( new Vertex( [Math.sin(deg2rad(ang)), 1, Math.cos(deg2rad(ang))] ));

        // v0    v2 
        //   o - o
        //   | \ |
        //   o - o
        // v3     v1

        if (i > 0)
        {
            let v1ind = v0ind - 72 -1;
            let v2ind = v0ind - 1;
            let v3ind = v0ind - 72

            let trian = new Triangle(v0ind, v1ind, v2ind);
            let trianInd = triangles.length;

            triangles.push( trian );
            vertices[v0ind].triangles.push(trianInd);
            vertices[v1ind].triangles.push(trianInd);
            vertices[v2ind].triangles.push(trianInd);

            let trian2 = new Triangle(v0ind, v3ind, v1ind);
            let trianInd2 = triangles.length;

            triangles.push( trian2 );
            vertices[v0ind].triangles.push(trianInd2);
            vertices[v3ind].triangles.push(trianInd2);
            vertices[v1ind].triangles.push(trianInd2);

        }

    }

    data.verticesF32 = new Float32Array(vertices.length*3);
    for (let i=0, len=vertices.length; i<len; i++)
    {
        data.verticesF32[i*3 + 0] = vertices[i].p[0];
        data.verticesF32[i*3 + 1] = vertices[i].p[1];
        data.verticesF32[i*3 + 2] = vertices[i].p[2];
    }

    data.indicesU16 = new Uint16Array(triangles.length*3);
    for (let i=0, len=triangles.length; i<len; i++)
    {
        data.indicesU16[i*3 + 0] = triangles[i].v0;
        data.indicesU16[i*3 + 1] = triangles[i].v1;
        data.indicesU16[i*3 + 2] = triangles[i].v2;
    }
}

function CreateSurfaceOfConjugationofTwoCoaxialCylinders(data) {
    const R1 = 1.0;  // radius of first cylinder
    const R2 = 3.0;  // radius of second cylinder (R2 > R1)
    const b = 3.0;   // height parameter
    
    const alphaMin = 0;
    const alphaMax = 2 * Math.PI;
    const betaMin = 0;
    const betaMax = 2 * Math.PI;
    
    const alphaResolution = 36;
    const betaResolution = 24;
    
    let vertices = [];
    let indices = [];
    
    // Generate vertices using parametric equations
    for (let ai = 0; ai <= alphaResolution; ai++) {
        const alpha = alphaMin + (alphaMax - alphaMin) * (ai / alphaResolution);
        
        for (let bi = 0; bi <= betaResolution; bi++) {
            const beta = betaMin + (betaMax - betaMin) * (bi / betaResolution);
            
            // Calculate r(α) using the law of change of radius
            const r = (R2 - R1) * Math.pow(Math.sin(Math.PI * alpha / (4 * b)), 2) + R1;
            
            // Parametric equations for the surface
            const x = r * Math.cos(beta);
            const y = r * Math.sin(beta);
            const z = alpha;
            
            vertices.push(x, y, z);
        }
    }
    
    // Generate triangle indices
    for (let ai = 0; ai < alphaResolution; ai++) {
        for (let bi = 0; bi < betaResolution; bi++) {
            const current = ai * (betaResolution + 1) + bi;
            const next = (ai + 1) * (betaResolution + 1) + bi;
            
            // First triangle
            indices.push(current);
            indices.push(next);
            indices.push(current + 1);
            
            // Second triangle
            indices.push(current + 1);
            indices.push(next);
            indices.push(next + 1);
        }
    }
    
    data.verticesF32 = new Float32Array(vertices);
    data.indicesU16 = new Uint16Array(indices);
}