var nano    = require('nano')('http://' + '127.0.0.1:5984'),
    Promise = require('bluebird')
    db      = require('./db')

/**
 * init will create a test doc, add it to existing db (to see if it exists),
 *     if it does, the doc is deleted. If not, the db will be created for use.
 * @param   name    The name of the db (that you want to create or check if it exists)
 * @return  true    If the db exists (or has been created)
 * @return  err     If there is an error
 */
exports.init = function (name) {
    return new Promise(function (resolve, reject) {
        var testdoc = {"hello" : "world"}
        var db = nano.use(name)
        db.insert(testdoc, function (err, body) {
            if(!err) {
                db.destroy(body.id, body.rev, function (err, body) {
                    if(!err) resolve(true)
                    else reject(err)
                })
            }
            else {
                nano.db.create(name, function (err, body) {
                    if(!err) resolve(true)
                    else reject(err)
                })
            }
        })
    })
}

/**
 * This will delete a specified document in a specified db.
 * @param  doc  The doc HAS to contain id and rev
 * @param  name The name of the db where the document it's stored in.
 */
exports.delete_doc = function (doc, name) {
    return new Promise(function (resolve, reject) {
        var db = nano.use(name)
        db.destroy(doc.id, doc.rev, function (err, body) {
            if(!err) resolve(body)
            else reject(err)
        })

    })
}

/**
 * This will insert a document to the specified db.
 * Keep in mind that the doc HAS TO CONTAIN an _id field.
 * @param   doc     The document to be inserted
 * @param   name    The name of the database
 * @return  body    If successful, the response will be returned.
 * @return  err     If unsuccessful, the error will be returned.
 */
exports.insert_doc = function (doc, name) {
    return new Promise(function (resolve, reject) {
        var db = nano.use(name)
        db.insert(doc, function (err, body) {
            if(!err) resolve(body)
            else reject(err)
        })
    })
}

/**
 * This will let you update your document
 * @param   old_doc This is the old doc you want to update (it HAS to have both _id and _rev)
 * @param   new_doc This is the new doc that you want as the latest doc (does not need to have id or rev as I am going to replace it with the older one)
 * @param   name    The name of the name
 * @return  body    The result
 * @return  err     The error if it occurs
 */
exports.update_doc = function (old_doc, new_doc, name) {
    return new Promise(function (resolve, reject) {
        new_doc._id = old_doc._id
        new_doc._rev = old_doc._rev
        var db = nano.use(name)
        db.insert(new_doc, new_doc._id, function (err, body) {
            if(!err) resolve(body)
            else reject(err)
        })
    })
}

/**
 * This will delete the database
 * @param   name The name of the db to be deleted
 */
exports.delete_db = function (name) {
     return new Promise(function (resolve, reject) {
        resolve(nano.db.destroy(name))
     })
}

/**
 * This will grab the specific view
 * @param   db_name     The name of the database
 * @param   design_name The name of the design doc
 * @param   view_name   The name of the view
 * @return  body        If no errors, the body would be returned
 * @return  err         If there are errors, the error will be returned
 */
exports.get_view = function (db_name, design_name, view_name) {
    return new Promise(function(resolve, reject) {
        var db = nano.db.use(db_name)
        db.view(design_name, view_name, function (err, body) {
            if(!err) resolve(body)
            else reject(err)
        })
    });
}

/**
 * This will grab a specific document who _id is provided
 * @param  _id  The _id of the document
 * @param  name The name of the db
 * @return body The response if there are no errors
 * @return err  The error if any
 */
exports.get_doc = function (_id, name) {
    return new Promise(function(resolve, reject) {
        var db = nano.use(name)
        db.get(_id, function (err, body) {
            if(!err) resolve(body)
            else reject(err)
        })
    });
}

/**
 * This will create or add views to the _design doc
 * @param  db_name         Name of the database
 * @param  design_name     The design name (Don't need to include _design\/)
 * @param  view_name       The name of the particular view
 * @param  map_function    The map function, cannot be null
 * @param  reduce_function The reduce function, can be null
 * @return result          The result
 * @return error           The error if any
 */
exports.create_view = function (db_name, design_name, view_name, map_function, reduce_function) {
    return new Promise(function(resolve, reject) {
        db.get_doc('_design\/'+ design_name, db_name)
            .then(function (response) {
                var old_doc = JSON.parse(JSON.stringify(response))
                var view_names = Object.keys(response.views)
                view_names.forEach(function (element) {
                    if(element == view_name) {
                        var temp_doc = response.views[element.toString()]
                        temp_doc.map = map_function
                        if (reduce_function != null) temp_doc.reduce = reduce_function
                        response.views[view_name.toString()] = temp_doc
                        if (reduce_function == null) delete(response.views[view_name.toString()].reduce)
                        return db.update_doc(old_doc, response, db_name)
                    }
                })
                var view_doc = {}
                view_doc.map = map_function
                if (reduce_function != null) view_doc.reduce = reduce_function
                response.views[view_name.toString()] = view_doc
                return db.update_doc(old_doc, response, db_name)
            })
            .then(function (result) {
                resolve(result)
            })
            .catch(function (error) {
                if(error.error == 'not_found') {
                    var doc = {}
                    doc._id = '_design\/' + design_name
                    doc.language = 'javascript'
                    var view_doc = {}
                    view_doc.map = map_function
                    if (reduce_function != null) view_doc.reduce = reduce_function
                    var view_main = {}
                    view_main[view_name.toString()] = view_doc
                    doc.views = view_main
                    db.insert_doc(doc, db_name)
                        .then(function (result) {
                            resolve(result)
                        })
                        .catch(function (error) {
                            reject(error)
                        })
                }
                else resolve(error)
            })
    });
}
