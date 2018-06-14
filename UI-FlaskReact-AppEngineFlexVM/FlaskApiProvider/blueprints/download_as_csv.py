from flask import Blueprint
from flask import Response

download_as_csv_bp = Blueprint('download_as_csv_bp',__name__)

@download_as_csv_bp.route('/api/download_as_csv/', methods=['GET', 'POST'])
def download_as_csv():
    csv = 'foo,bar,baz\nhai,bai,crai\n'
    return Response(
        csv,
        mimetype="text/csv",
        headers={"Content-disposition":
                     "attachment; filename=myplot.csv"})



